import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { AccessCardsRepository } from '../repositories/access-cards.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateCardBatchDto } from '../dto/create-card-batch.dto';
import { IssueCardDto } from '../dto/issue-card.dto';
import { ReturnCardDto } from '../dto/return-card.dto';
import { UpdateCardStatusDto } from '../dto/update-card-status.dto';
import { CardStatus, CardActionType } from '@domas/ts-types';

@Injectable()
export class AccessCardsService {
  private readonly logger = new Logger(AccessCardsService.name);

  constructor(
    private readonly repository: AccessCardsRepository,
    private readonly db: DatabaseService,
  ) {}

  async createBatch(data: CreateCardBatchDto, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
      const batch = await this.repository.createBatch(
        { ...data, createdBy: context.userId },
        client,
      );
      await this.repository.createCardsInBatch(batch.id, data.rangeStart, data.rangeEnd, client);
      return batch;
    }, context);
  }

  async findAllBatches() {
    return this.repository.findAllBatches();
  }

  async findAllCards(filters: { batchId?: number; status?: CardStatus }) {
    return this.repository.findAllCards(filters);
  }

  async issueCard(data: IssueCardDto, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
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

      return card;
    }, context);
  }

  async returnCard(id: number, data: ReturnCardDto, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
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

      return updatedCard;
    }, context);
  }

  async updateStatus(id: number, data: UpdateCardStatusDto, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
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

      return updatedCard;
    }, context);
  }

  async getLogs(cardId: number) {
    return this.repository.findLogsByCard(cardId);
  }
}
