export class RoomType {
  id!: number;
  name!: string;
  description?: string;
  galleryUrls!: string[];
  amenities!: string[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<RoomType>) {
    Object.assign(this, partial);
  }
}
