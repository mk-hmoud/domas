export class Country {
  code!: string;
  nameEn!: string;
  nameTr!: string;
  createdAt!: Date;

  constructor(partial: Partial<Country>) {
    Object.assign(this, partial);
  }
}
