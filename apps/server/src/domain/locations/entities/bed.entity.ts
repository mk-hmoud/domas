import { BedStatus } from '../../../common/enums/bed-status.enum';

export class Bed {
  id!: number;
  locationId!: number;
  label!: string;
  status!: BedStatus;
  isTrOnly!: boolean;
  isForeignerOnly!: boolean;
  isGuestZone!: boolean;
  isRectorate!: boolean;
  updatedAt!: Date;

  constructor(partial: Partial<Bed>) {
    Object.assign(this, partial);
  }
}
