export class Department {
  nameEn!: string;
  nameTr!: string;
  createdAt!: Date;

  constructor(partial: Partial<Department>) {
    Object.assign(this, partial);
  }
}
