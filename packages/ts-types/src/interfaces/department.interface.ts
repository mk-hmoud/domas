export interface Department {
  nameEn: string;
  nameTr: string;
  createdAt: Date;
}

export interface CreateDepartmentDto {
  nameEn: string;
  nameTr: string;
}

export interface UpdateDepartmentDto {
  nameEn?: string;
  nameTr?: string;
}
