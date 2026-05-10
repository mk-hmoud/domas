import { SemesterStatus } from '../../../common/enums/semester-status.enum';
import { SemesterType } from '../../../common/enums/semester-type.enum';

export class Semester {
  id!: number;
  type!: SemesterType;
  academicYear!: string;
  displayName!: string;
  startDate!: Date;
  endDate!: Date;
  bookingStartDate!: Date;
  bookingEndDate!: Date;
  depositAmountTry!: number;
  depositAmountForeign!: number;
  foreignCurrencyCode!: string;
  paymentDeadlineDate?: Date;
  status!: SemesterStatus;
  maxRoomChanges?: number | null;
  paidRoomChangeAfter?: number | null;
  roomChangeAmountTry!: number;
  roomChangeAmountForeign!: number;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;

  constructor(partial: Partial<Semester>) {
    Object.assign(this, partial);
  }
}
