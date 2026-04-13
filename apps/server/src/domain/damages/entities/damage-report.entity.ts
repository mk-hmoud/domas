import { DamageStatus } from '../../../common/enums/damage-status.enum';

export class DamageReport {
  id!: string;
  locationId!: number;
  snapshotId?: number;
  catalogId?: number;
  manualCostTry?: number;
  manualCostForeign?: number;
  manualCurrencyCode?: string;
  description!: string;
  culpritIds?: string[];
  culpritGuestStayIds?: string[];
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
