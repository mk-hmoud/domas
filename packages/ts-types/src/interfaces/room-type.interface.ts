export interface RoomType {
  id: number;
  name: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls: string[];
  amenities: string[];
  capacity: number;
  genderLock?: string | null;
  studentYearLock?: string | null;
  isGuestZone: boolean;
  isTrOnly: boolean;
  isForeignerOnly: boolean;
  isRectorate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomTypeDto {
  name: string;
  nameTr?: string;
  capacity: number;
  description?: string;
  descriptionTr?: string;
  galleryUrls?: string[];
  amenities?: string[];
  genderLock?: string | null;
  studentYearLock?: string | null;
  isGuestZone?: boolean;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  isRectorate?: boolean;
}

export interface UpdateRoomTypeDto {
  name?: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls?: string[];
  amenities?: string[];
  capacity?: number;
  genderLock?: string | null;
  studentYearLock?: string | null;
  isGuestZone?: boolean;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  isRectorate?: boolean;
}
