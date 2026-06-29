export interface RoomFlagChange {
  eventTimestamp: string;
  performedBy?: string;
  changedFields: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface RoomResidentEntry {
  bookingId: string;
  bedLabel: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  nationalityCode: string;
  gender: string;
  semesterName: string;
  bookingStatus: string;
  startDate: string;
  endDate: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface RoomHistory {
  flagChanges: RoomFlagChange[];
  residents: RoomResidentEntry[];
}
