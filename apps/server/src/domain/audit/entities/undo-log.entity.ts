export class UndoLog {
  id!: string;
  eventTimestamp!: Date;
  userId!: string;
  performedByEmail?: string;
  performedByName?: string;
  sessionId?: string;
  actionType!: string;
  entityType!: string;
  entityId!: string;
  undoData!: any;
  redoData?: any;
  description?: string;
  undoneAt?: Date;
  undoneBy?: string;
  expiresAt!: Date;
  deletedAt?: Date;

  constructor(partial: Partial<UndoLog>) {
    Object.assign(this, partial);
  }
}
