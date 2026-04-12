export interface CreateAnnouncementDto {
  title: string;
  body: string;
  pinned?: boolean;
  expiresAt?: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  body?: string;
  pinned?: boolean;
  expiresAt?: string | null;
}
