export interface RoomType {
  id: number;
  name: string;
  description?: string;
  galleryUrls: string[];
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomTypeDto {
  name: string;
  description?: string;
  galleryUrls?: string[];
  amenities?: string[];
}

export interface UpdateRoomTypeDto {
  name?: string;
  description?: string;
  galleryUrls?: string[];
  amenities?: string[];
}
