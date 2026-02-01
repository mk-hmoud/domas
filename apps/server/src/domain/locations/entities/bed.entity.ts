import { BedStatus } from '../../../common/enums/bed-status.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class Bed {
  id!: number;
  locationId!: number;
  label!: string;
  status!: BedStatus;
  isTrOnly!: boolean;
  isGuestZone!: boolean;
  ownership!: LocationOwnership;
  updatedAt!: Date;

  constructor(partial: Partial<Bed>) {
    Object.assign(this, partial);
  }
}
