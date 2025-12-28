import { GenderType } from '../../../common/enums/gender-type.enum';
import { LocationType } from '../../../common/enums/location-type.enum';

export class Location {
  id!: number;
  name!: string;
  treePath!: string;
  type!: LocationType;
  genderLock!: GenderType | null;
  isGuestZone!: boolean;
  capacity!: number;
  basePrice!: number | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Location>) {
    Object.assign(this, partial);
  }
}
