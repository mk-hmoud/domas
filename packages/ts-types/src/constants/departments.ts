export const DEPARTMENTS = [
  "Computer Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Medicine",
  "Dentistry",
  "Pharmacy",
  "Law",
  "Psychology",
  "Architecture",
  "Business Administration",
  "Economics",
  "International Relations",
  "Political Science",
  "English Language and Literature",
  "Education",
  "Fine Arts",
  "Communication",
  "Nursing",
  "Physiotherapy",
] as const;

export type DepartmentType = (typeof DEPARTMENTS)[number];
