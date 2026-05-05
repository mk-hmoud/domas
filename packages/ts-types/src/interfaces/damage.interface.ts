import { DamageStatus } from "../enums/damage-status.enum";

export interface DamageReportImage {
  id: string;
  damageReportId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

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
  culpritGuestStayIds?: string[];
  status: DamageStatus;
  reportedBy: string;
  reportedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  images?: DamageReportImage[];
}

export interface DamageLiability {
  id: string;
  damageReportId: string;
  studentId?: string;
  guestStayId?: string;
  amount: number;
  currency: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}
