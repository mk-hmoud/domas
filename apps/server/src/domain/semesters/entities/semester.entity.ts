export class Semester {
  id!: number;
  name!: string;
  startDate!: Date;
  endDate!: Date;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Semester>) {
    Object.assign(this, partial);
  }
}
