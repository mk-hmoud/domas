export interface AttachmentMeta {
  id: string;
  announcementId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export class Announcement {
  id!: string;
  title!: string;
  body!: string;
  pinned!: boolean;
  isPublished!: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  createdBy!: string;
  createdByName!: string;
  createdAt!: Date;
  updatedAt!: Date;
  attachments!: AttachmentMeta[];

  constructor(partial: Partial<Announcement>) {
    Object.assign(this, partial);
  }
}
