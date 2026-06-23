export interface Country {
  code: string;
  nameEn: string;
  nameTr: string;
  createdAt: Date;
}

export interface CreateCountryDto {
  code: string;
  nameEn: string;
  nameTr: string;
}

export interface UpdateCountryDto {
  nameEn?: string;
  nameTr?: string;
}
