export class DocumentTemplate {
  id!: string;
  documentType!: string;
  language!: string;
  name!: string;
  htmlBody!: string;
  css!: string;
  isActive!: boolean;
  createdBy?: string | null;
  createdByName?: string;
  createdAt!: Date;

  constructor(partial: Partial<DocumentTemplate>) {
    Object.assign(this, partial);
  }
}
