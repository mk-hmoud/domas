import { BedStatus } from '../../../common/enums/bed-status.enum';

export class Bed {
  id!: number;
  locationId!: number;
  label!: string;
  status!: BedStatus;
  updatedAt!: Date;

  constructor(partial: Partial<Bed>) {
    Object.assign(this, partial);
  }
}
