export enum UserRole {
  ADMIN = 'admin',
  REVIEWER = 'reviewer',
  STUDENT = 'student',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
