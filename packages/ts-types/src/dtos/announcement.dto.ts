import {
  AnnouncementAudienceMode,
  AnnouncementTargetType,
} from "../interfaces/announcement.interface";

export interface AnnouncementTargetDto {
  targetType: AnnouncementTargetType;
  studentId?: string;
  semesterId?: number;
  locationId?: number;
}

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  pinned?: boolean;
  expiresAt?: string;
  audienceMode?: AnnouncementAudienceMode;
  targets?: AnnouncementTargetDto[];
}

export interface UpdateAnnouncementDto {
  title?: string;
  body?: string;
  pinned?: boolean;
  expiresAt?: string | null;
  audienceMode?: AnnouncementAudienceMode;
  targets?: AnnouncementTargetDto[];
}
