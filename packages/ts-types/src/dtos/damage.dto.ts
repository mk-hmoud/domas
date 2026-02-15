import { DamageStatus } from "../enums/damage-status.enum";

export interface CreateDamageReportDto {
  locationId: number;
  snapshotId?: number;
  catalogId?: number; // Optional: Link directly to catalog item
  manualCostTry?: number;
  manualCostForeign?: number;
  manualCurrencyCode?: string;
  description: string;
  culpritIds?: string[]; // Array of student IDs
}

export interface ReviewDamageReportDto {
  status: DamageStatus;
}
