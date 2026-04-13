export interface RoomType {
  id: number;
  name: string;
  description?: string;
  galleryUrls: string[];
  amenities: string[];
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomTypeDto {
  name: string;
  description?: string;
  galleryUrls?: string[];
  amenities?: string[];
  capacity?: number;
}

export interface UpdateRoomTypeDto {
  name?: string;
  description?: string;
  galleryUrls?: string[];
  amenities?: string[];
  capacity?: number;
}
