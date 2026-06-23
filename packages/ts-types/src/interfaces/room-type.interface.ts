export interface RoomType {
  id: number;
  name: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls: string[];
  amenities: string[];
  capacity: number;
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
}

export interface UpdateRoomTypeDto {
  name?: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls?: string[];
  amenities?: string[];
  capacity?: number;
}
