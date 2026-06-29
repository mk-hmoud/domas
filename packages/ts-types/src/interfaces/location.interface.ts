import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { StudentYearLock } from "../enums/student-year-lock.enum";

export interface Location {
  id: number;
  name: string;
  nameTr?: string;
  treePath: string;
  type: LocationType;
  genderLock: GenderType | null;
  studentYearLock: StudentYearLock | null;
  isGuestZone: boolean;
  isTrOnly: boolean;
  isForeignerOnly: boolean;
  isRectorate: boolean;
  roomTypeId?: number | null;
  roomTypeName?: string;
  roomTypeNameTr?: string;
  locationPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AncestorFlagSource {
  value: any;
  sourceId: number;
  sourceName: string;
}

export interface AncestorFlagsResult {
  isTrOnly: AncestorFlagSource | null;
  isForeignerOnly: AncestorFlagSource | null;
  isGuestZone: AncestorFlagSource | null;
  isRectorate: AncestorFlagSource | null;
  genderLock: AncestorFlagSource | null;
  studentYearLock: AncestorFlagSource | null;
}

export interface LocationFlagContext {
  ancestorFlags: AncestorFlagsResult;
  descendantCount: { locations: number; beds: number };
  descendantPreview: {
    id: number;
    name: string;
    nameTr?: string;
    type: string;
  }[];
}
