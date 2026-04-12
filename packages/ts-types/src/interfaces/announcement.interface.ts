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
}
