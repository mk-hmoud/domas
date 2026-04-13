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

  constructor(partial: Partial<Announcement>) {
    Object.assign(this, partial);
  }
}
