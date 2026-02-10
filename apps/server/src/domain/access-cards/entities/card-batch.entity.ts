export class CardBatch {
  id!: number;
  locationId?: number;
  name!: string;
  rangeStart!: number;
  rangeEnd!: number;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;

  constructor(partial: Partial<CardBatch>) {
    Object.assign(this, partial);
  }
}
