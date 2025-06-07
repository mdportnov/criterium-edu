import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
});

export const TokenSchema = z.object({
  access_token: z.string(),
});

export const LoginAsSchema = z.object({
  userId: z.string().uuid(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type TokenDto = z.infer<typeof TokenSchema>;
export type LoginAsDto = z.infer<typeof LoginAsSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const LoginDto = {} as LoginDto;
export const RegisterDto = {} as RegisterDto;
export const TokenDto = {} as TokenDto;
export const LoginAsDto = {} as LoginAsDto;
