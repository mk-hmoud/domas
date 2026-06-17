export interface AnnouncementAttachmentMeta {
  id: string;
  announcementId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export type AnnouncementAudienceMode = "all" | "targeted";
export type AnnouncementTargetType = "student" | "semester" | "location";

export interface AnnouncementTarget {
  id: string;
  targetType: AnnouncementTargetType;
  studentId?: string;
  studentName?: string;
  semesterId?: number;
  semesterDisplayName?: string;
  locationId?: number;
  locationName?: string;
  locationPath?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  isPublished: boolean;
  publishedAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  attachments: AnnouncementAttachmentMeta[];
  audienceMode: AnnouncementAudienceMode;
  targets: AnnouncementTarget[];
}
