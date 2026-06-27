import { GenderType } from '../../../common/enums/gender-type.enum';
import { StudentYearLock } from '../../../common/enums/student-year-lock.enum';

export class RoomType {
  id!: number;
  name!: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls!: string[];
  amenities!: string[];
  capacity!: number;
  genderLock!: GenderType | null;
  studentYearLock!: StudentYearLock | null;
  isGuestZone!: boolean;
  isTrOnly!: boolean;
  isForeignerOnly!: boolean;
  isRectorate!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<RoomType>) {
    Object.assign(this, partial);
  }
}
