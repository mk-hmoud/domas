import { DamageStatus } from '@domas/ts-types';

export class DamageReport {
  id!: string;
  locationId!: number;
  snapshotId?: number;
  manualCostTry?: number;
  manualCostForeign?: number;
  manualCurrencyCode?: string;
  description!: string;
  culpritIds?: string[];
  status!: DamageStatus;
  reportedBy!: string;
  reportedAt!: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<DamageReport>) {
    Object.assign(this, partial);
  }
}
