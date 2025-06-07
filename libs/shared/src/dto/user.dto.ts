import { z } from 'zod';
import { UserRole } from '../interfaces';

export const CreateUserDtoSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string(),
  role: z.nativeEnum(UserRole),
});

export const UpdateUserDtoSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.nativeEnum(UserRole),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;
export type UserDto = z.infer<typeof UserDtoSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const CreateUserDto = {} as CreateUserDto;
export const UpdateUserDto = {} as UpdateUserDto;
export const UserDto = {} as UserDto;
