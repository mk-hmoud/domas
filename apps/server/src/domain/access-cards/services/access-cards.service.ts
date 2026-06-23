import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AccessCardsRepository } from '../repositories/access-cards.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { AccessCard } from '../entities/access-card.entity';
import { DatabaseService } from '../../../core/database/database.service';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateCardBatchDto } from '../dto/create-card-batch.dto';
import { IssueCardDto } from '../dto/issue-card.dto';
import { ReturnCardDto } from '../dto/return-card.dto';
import { UpdateCardStatusDto } from '../dto/update-card-status.dto';
import { CardStatus } from '../../../common/enums/card-status.enum';
import { CardActionType } from '../../../common/enums/card-action-type.enum';
import { LocationType } from '../../../common/enums/location-type.enum';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { PoolClient } from 'pg';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';

@Injectable()
export class AccessCardsService {
  private readonly logger = new Logger(AccessCardsService.name);

  constructor(
    private readonly repository: AccessCardsRepository,
    private readonly locationsRepository: LocationsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  // Cards with no resolvable location (no current booking, batch-less) are
  // only reachable by unrestricted staff.
  private async assertCardInScope(
    cardId: number,
    context: AuditUserContext,
    client?: PoolClient,
  ): Promise<void> {
    if (context.locationScope?.unrestricted) return;
    const treePath = await this.repository.getCardTreePath(cardId, client);
    this.locationScopeService.assertAccess(context.locationScope, treePath ?? '');
  }

  async createBatch(
    data: CreateCardBatchDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ) {
    const operation = async (client: PoolClient) => {
      let batchName = `Batch ${data.rangeStart}-${data.rangeEnd}`;

      if (data.locationId) {
        const location = await this.locationsRepository.findById(data.locationId, client);
        if (!location) throw new NotFoundException(`Location ${data.locationId} not found`);

        if (location.type !== LocationType.BUILDING && location.type !== LocationType.BLOCK) {
          throw new BadRequestException(
            'Access card batches can only be associated with Buildings or Blocks',
          );
        }
        this.locationScopeService.assertAccess(context.locationScope, location.treePath);
        batchName = `${location.name} (${data.rangeStart}-${data.rangeEnd})`;
      } else {
        // A campus-wide (unassigned) batch is reserved for unrestricted staff.
        this.locationScopeService.assertAccess(context.locationScope, '');
      }

      const batch = await this.repository.createBatch(
        { ...data, name: batchName, createdBy: context.userId },
        client,
      );
      await this.repository.createCardsInBatch(batch.id, data.rangeStart, data.rangeEnd, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CREATE_CARD_BATCH,
          entityType: 'card_batch',
          entityId: batch.id.toString(),
          undoData: {},
          description: `Created card batch ${batch.name}`,
        },
        client,
      );

      return batch;
    };

    if (externalClient) return operation(externalClient);
    return this.db.transaction(operation, context);
  }

  async findAllBatches(context: AuditUserContext) {
    return this.repository.findAllBatches(context.locationScope);
  }

  async findAllCards(
    filters: { batchId?: number; status?: CardStatus },
    context: AuditUserContext,
  ) {
    return this.repository.findAllCards(filters, context.locationScope);
  }

  async issueCard(
    data: IssueCardDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
    skipUndo = false,
  ) {
    const operation = async (client: PoolClient) => {
      if (!context.locationScope?.unrestricted) {
        const bookingLocation = await client.query(
          `SELECT l.tree_path as "treePath"
           FROM bookings b
           JOIN beds bd ON b.bed_id = bd.id
           JOIN locations l ON bd.location_id = l.id
           WHERE b.id = $1`,
          [data.bookingId],
        );
        this.locationScopeService.assertAccess(
          context.locationScope,
          bookingLocation.rows[0]?.treePath ?? '',
        );
      }

      let card: AccessCard | null;

      // SCENARIO 1: Manual Input (Receptionist types specific number)
      if (data.cardNumber) {
        card = await this.repository.issueSpecificCard(
          data.cardNumber,
          data.studentId,
          data.bookingId,
          context.userId,
          client,
        );

        if (!card) {
          const exists = await this.repository.findByCardNumber(data.cardNumber, client);
          if (!exists) throw new NotFoundException(`Card ${data.cardNumber} not found`);
          throw new BadRequestException(`Card ${data.cardNumber} is already in use or unavailable`);
        }
      }
      // SCENARIO 2: Auto-Assign (System picks random)
      else {
        card = await this.repository.assignRandomCard(
          data.studentId,
          data.bookingId,
          context.userId,
          data.batchId,
          client,
        );

        if (!card) throw new BadRequestException('No available cards found in the pool');
      }

      await this.repository.createLog(
        {
          cardId: card!.id,
          studentId: data.studentId,
          bookingId: data.bookingId,
          actionType: CardActionType.ISSUED,
          performedBy: context.userId,
        },
        client,
      );

      // If the batch is linked to a catalog item, create an inventory snapshot
      // so that a lost card can be tracked as a damage liability at checkout.
      const batch = await this.repository.findBatchById(card.batchId, client);
      if (batch?.catalogId) {
        await this.repository.createCardSnapshot(
          card.id,
          data.bookingId,
          batch.catalogId,
          context.userId,
          client,
        );
      }

      if (!skipUndo) {
        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: UndoActionType.ISSUE_CARD,
            entityType: 'access_card',
            entityId: card.id.toString(),
            undoData: {
              previousStatus: CardStatus.AVAILABLE,
              studentId: data.studentId,
              bookingId: data.bookingId,
            },
            description: `Issued card #${card.cardNumber} to student ${data.studentId}`,
          },
          client,
        );
      }

      return card;
    };

    if (externalClient) return operation(externalClient);
    return this.db.transaction(operation, context);
  }

  async returnCard(
    id: number,
    data: ReturnCardDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
    skipUndo = false,
  ) {
    const operation = async (client: PoolClient) => {
      const card = await this.repository.findById(id, client);
      if (!card) throw new NotFoundException(`Card with ID ${id} not found`);
      await this.assertCardInScope(id, context, client);
      if (card.status !== CardStatus.ACTIVE) {
        throw new BadRequestException(`Card is not active (Status: ${card.status})`);
      }

      const updatedCard = await this.repository.updateCard(
        id,
        {
          status: CardStatus.AVAILABLE,
          currentHolderId: undefined,
          currentBookingId: undefined,
          returnedAt: new Date(),
        },
        client,
      );

      await this.repository.createLog(
        {
          cardId: id,
          studentId: card.currentHolderId,
          bookingId: card.currentBookingId,
          actionType: CardActionType.RETURNED,
          performedBy: context.userId,
          notes: data.notes,
        },
        client,
      );

      if (!skipUndo) {
        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: UndoActionType.RETURN_CARD,
            entityType: 'access_card',
            entityId: id.toString(),
            undoData: {
              previousStatus: card.status,
              previousHolderId: card.currentHolderId,
              previousBookingId: card.currentBookingId,
            },
            description: `Returned card #${card.cardNumber}`,
          },
          client,
        );
      }

      return updatedCard;
    };

    if (externalClient) return operation(externalClient);
    return this.db.transaction(operation, context);
  }

  async updateStatus(
    id: number,
    data: UpdateCardStatusDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ) {
    const operation = async (client: PoolClient) => {
      const card = await this.repository.findById(id, client);
      if (!card) throw new NotFoundException(`Card with ID ${id} not found`);
      await this.assertCardInScope(id, context, client);

      const isQuarantined =
        data.status === CardStatus.LOST ||
        data.status === CardStatus.BROKEN ||
        data.status === CardStatus.VOID;

      const updatedCard = await this.repository.updateCard(
        id,
        {
          status: data.status,
          currentHolderId: isQuarantined ? (null as any) : undefined,
          currentBookingId: isQuarantined ? (null as any) : undefined,
        },
        client,
      );

      let actionType: CardActionType;
      switch (data.status) {
        case CardStatus.LOST:
          actionType = CardActionType.LOST;
          break;
        case CardStatus.BROKEN:
          actionType = CardActionType.BROKEN;
          break;
        case CardStatus.VOID:
          actionType = CardActionType.VOID;
          break;
        case CardStatus.AVAILABLE:
          actionType = CardActionType.RETURNED;
          break;
        default:
          actionType = CardActionType.VOID;
      }

      await this.repository.createLog(
        {
          cardId: id,
          studentId: card.currentHolderId,
          bookingId: card.currentBookingId,
          actionType,
          performedBy: context.userId,
          notes: data.notes,
        },
        client,
      );

      // Auto-create a pending damage report so the replacement cost becomes a
      // student liability that goes through the normal manager-approval flow.
      if (
        (data.status === CardStatus.LOST || data.status === CardStatus.BROKEN) &&
        card.snapshotId &&
        card.currentBookingId
      ) {
        const locationRes = await client.query(
          `SELECT l.id
           FROM bookings b
           JOIN beds bd ON b.bed_id = bd.id
           JOIN locations l ON bd.location_id = l.id
           WHERE b.id = $1`,
          [card.currentBookingId],
        );

        if (locationRes.rows[0]) {
          const description =
            data.status === CardStatus.BROKEN
              ? `Access card #${card.cardNumber} reported broken`
              : `Access card #${card.cardNumber} reported lost`;
          await client.query(
            `INSERT INTO damage_reports
               (location_id, snapshot_id, description, reported_by, culprit_ids, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [
              locationRes.rows[0].id,
              card.snapshotId,
              description,
              context.userId,
              card.currentHolderId ? [card.currentHolderId] : null,
            ],
          );
        }
      }

      if (data.status === CardStatus.LOST || data.status === CardStatus.BROKEN) {
        const undoActionType =
          data.status === CardStatus.LOST
            ? UndoActionType.MARK_CARD_LOST
            : UndoActionType.MARK_CARD_BROKEN;
        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: undoActionType,
            entityType: 'access_card',
            entityId: id.toString(),
            undoData: {
              previousStatus: card.status,
              previousHolderId: card.currentHolderId,
              previousBookingId: card.currentBookingId,
            },
            description: `Marked card #${card.cardNumber} as ${data.status}`,
          },
          client,
        );
      }

      return updatedCard;
    };

    if (externalClient) return operation(externalClient);
    return this.db.transaction(operation, context);
  }

  async reinstateCard(
    id: number,
    data: { notes?: string },
    context: AuditUserContext,
    externalClient?: PoolClient,
  ) {
    const operation = async (client: PoolClient) => {
      const card = await this.repository.findById(id, client);
      if (!card) throw new NotFoundException(`Card with ID ${id} not found`);
      await this.assertCardInScope(id, context, client);

      const quarantinedStatuses = [CardStatus.LOST, CardStatus.BROKEN, CardStatus.VOID];
      if (!quarantinedStatuses.includes(card.status)) {
        throw new BadRequestException(
          `Card is not quarantined (Status: ${card.status}). Only lost, broken, or void cards can be reinstated.`,
        );
      }

      const updatedCard = await this.repository.updateCard(
        id,
        {
          status: CardStatus.AVAILABLE,
          currentHolderId: null as any,
          currentBookingId: null as any,
        },
        client,
      );

      await this.repository.createLog(
        {
          cardId: id,
          actionType: CardActionType.REINSTATED,
          performedBy: context.userId,
          notes: data.notes,
        },
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.REINSTATE_CARD,
          entityType: 'access_card',
          entityId: id.toString(),
          undoData: { previousStatus: card.status },
          description: `Reinstated card #${card.cardNumber} (was ${card.status})`,
        },
        client,
      );

      return updatedCard;
    };

    if (externalClient) return operation(externalClient);
    return this.db.transaction(operation, context);
  }

  async getLogs(cardId: number, context: AuditUserContext) {
    await this.assertCardInScope(cardId, context);
    return this.repository.findLogsByCard(cardId);
  }

  async relinkCardForTransfer(
    oldBookingId: string,
    newBookingId: string,
    studentId: string,
    context: AuditUserContext,
    client: PoolClient,
  ): Promise<AccessCard | null> {
    const activeCards = await this.repository.findAllCards({
      status: CardStatus.ACTIVE,
    });
    const card = activeCards.find((c) => c.currentBookingId === oldBookingId);

    if (!card) return null;

    const updated = await this.repository.updateCard(
      card.id,
      { currentBookingId: newBookingId },
      client,
    );

    await this.repository.createLog(
      {
        cardId: card.id,
        studentId,
        bookingId: newBookingId,
        actionType: CardActionType.ISSUED, // Re-issued for new booking
        performedBy: context.userId,
        notes: `Transfer rollover from booking ${oldBookingId}`,
      },
      client,
    );

    return updated;
  }
}
