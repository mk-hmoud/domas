export class RoomType {
  id!: number;
  name!: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls!: string[];
  amenities!: string[];
  capacity!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<RoomType>) {
    Object.assign(this, partial);
  }
}
