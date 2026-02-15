import { GenderType } from '../../../common/enums/gender-type.enum';
import { LocationType } from '../../../common/enums/location-type.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class Location {
  id!: number;
  name!: string;
  treePath!: string;
  type!: LocationType;
  genderLock!: GenderType | null;
  isGuestZone!: boolean;
  isTrOnly!: boolean;
  ownership!: LocationOwnership;
  basePrice!: number | null;
  locationPath?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Location>) {
    Object.assign(this, partial);
  }
}
