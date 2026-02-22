import { ContractType } from "../enums/contract-type.enum";

export interface BookingContract {
  bookingId: string;
  type: ContractType;
  pdfData: any; // Blob or Buffer depending on side
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}
