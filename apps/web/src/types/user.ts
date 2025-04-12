export enum UserRole {
  ADMIN = 'admin',
  MENTOR = 'mentor',
  STUDENT = 'student',
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: UserRole;
}
