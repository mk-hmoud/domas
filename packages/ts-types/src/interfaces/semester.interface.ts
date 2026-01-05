export interface Semester {
  id: number;
  name: string;
  startDate: string; // Dates often transmitted as ISO strings
  endDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
