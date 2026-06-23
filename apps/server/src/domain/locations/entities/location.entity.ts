import { GenderType } from '../../../common/enums/gender-type.enum';
import { StudentYearLock } from '../../../common/enums/student-year-lock.enum';
import { LocationType } from '../../../common/enums/location-type.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class Location {
  id!: number;
  name!: string;
  nameTr?: string;
  treePath!: string;
  type!: LocationType;
  genderLock!: GenderType | null;
  studentYearLock!: StudentYearLock | null;
  isGuestZone!: boolean;
  isTrOnly!: boolean;
  isForeignerOnly!: boolean;
  ownership!: LocationOwnership;
  roomTypeId!: number | null;
  roomTypeName?: string;
  locationPath?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Location>) {
    Object.assign(this, partial);
  }
}
