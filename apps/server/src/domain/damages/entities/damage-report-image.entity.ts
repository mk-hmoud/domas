export class DamageReportImage {
  id!: string;
  damageReportId!: string;
  filename!: string;
  mimeType!: string;
  size!: number;
  storageKey!: string;
  createdAt!: Date;

  constructor(partial: Partial<DamageReportImage>) {
    Object.assign(this, partial);
  }
}
