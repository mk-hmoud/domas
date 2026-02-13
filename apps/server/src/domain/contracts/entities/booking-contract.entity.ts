export class BookingContract {
  bookingId!: string;
  pdfData!: Buffer;
  fileSize!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<BookingContract>) {
    Object.assign(this, partial);
  }
}
