import { SemesterStatus } from "../enums/semester-status.enum";

export interface UpdateStatusDto {
  status: SemesterStatus;
}
