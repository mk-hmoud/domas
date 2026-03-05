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

@Injectable()
export class AccessCardsService {
  private readonly logger = new Logger(AccessCardsService.name);

  constructor(
    private readonly repository: AccessCardsRepository,
    private readonly locationsRepository: LocationsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
  ) {}

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
        batchName = `${location.name} (${data.rangeStart}-${data.rangeEnd})`;
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

  async findAllBatches() {
    return this.repository.findAllBatches();
  }

  async findAllCards(filters: { batchId?: number; status?: CardStatus }) {
    return this.repository.findAllCards(filters);
  }

  async issueCard(
    data: IssueCardDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
    skipUndo = false,
  ) {
    const operation = async (client: PoolClient) => {
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

      const updatedCard = await this.repository.updateCard(
        id,
        {
          status: data.status,
          // If losing or voiding, clear holder
          currentHolderId: data.status !== CardStatus.ACTIVE ? (null as any) : undefined,
          currentBookingId: data.status !== CardStatus.ACTIVE ? (null as any) : undefined,
        },
        client,
      );

      let actionType: CardActionType;
      switch (data.status) {
        case CardStatus.LOST:
          actionType = CardActionType.LOST;
          break;
        case CardStatus.VOID:
          actionType = CardActionType.VOID;
          break;
        case CardStatus.AVAILABLE:
          actionType = CardActionType.RETURNED;
          break;
        default:
          actionType = CardActionType.VOID; // Fallback
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

      // Status updates are generally not undone via a specific undo action in this repo's pattern
      // but we could register it if needed. For now, following existing pattern.

      return updatedCard;
    };

    if (externalClient) return operation(externalClient);
    return this.db.transaction(operation, context);
  }

  async getLogs(cardId: number) {
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
