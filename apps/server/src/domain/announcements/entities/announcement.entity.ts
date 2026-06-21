export interface AttachmentMeta {
  id: string;
  announcementId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface AnnouncementTarget {
  id: string;
  targetType: 'student' | 'semester' | 'location';
  studentId?: string;
  studentName?: string;
  semesterId?: number;
  semesterDisplayName?: string;
  locationId?: number;
  locationName?: string;
  locationPath?: string;
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
  audienceMode!: 'all' | 'targeted';
  targets!: AnnouncementTarget[];

  constructor(partial: Partial<Announcement>) {
    Object.assign(this, partial);
  }
}
