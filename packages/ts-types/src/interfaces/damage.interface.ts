import { DamageStatus } from "../enums/damage-status.enum";

export interface DamageReport {
  id: string;
  locationId: number;
  snapshotId?: number;
  catalogId?: number;
  manualCostTry?: number;
  manualCostForeign?: number;
  manualCurrencyCode?: string;
  description: string;
  culpritIds?: string[];
  status: DamageStatus;
  reportedBy: string;
  reportedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DamageLiability {
  id: string;
  damageReportId: string;
  studentId: string;
  amount: number;
  currency: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}
