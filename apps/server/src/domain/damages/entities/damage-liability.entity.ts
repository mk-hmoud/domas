export class DamageLiability {
  id!: string;
  damageReportId!: string;
  studentId!: string;
  amount!: number;
  currency!: string;
  transactionId?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<DamageLiability>) {
    Object.assign(this, partial);
  }
}
