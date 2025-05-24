// Frontend-safe exports from shared library
// This file only exports interfaces and types, no classes with decorators

export * from './interfaces/user.interface';
export * from './interfaces/current-user';
export * from './interfaces/task.interface';
export * from './interfaces/task-solution.interface';
export * from './interfaces/task-solution-review.interface';

// Re-export plain interface versions of DTOs (without class-validator decorators)
export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: import('./interfaces/user.interface').UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: import('./interfaces/user.interface').UserRole;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: import('./interfaces/user.interface').UserRole;
}
