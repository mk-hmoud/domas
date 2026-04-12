export class Guest {
  id!: string;
  firstName!: string;
  lastName!: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt!: Date;

  constructor(partial: Partial<Guest>) {
    Object.assign(this, partial);
  }
}
