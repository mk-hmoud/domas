import { DamageStatus } from "../enums/damage-status.enum";

export interface CreateDamageReportDto {
  locationId: number;
  snapshotId?: number;
  manualCostTry?: number;
  manualCostForeign?: number;
  manualCurrencyCode?: string;
  description: string;
  culpritIds?: string[]; // Array of student IDs
}

export interface ReviewDamageReportDto {
  status: DamageStatus;
}
