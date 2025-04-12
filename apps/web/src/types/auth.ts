import { UserRole } from './user.ts';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  iat: number;
  exp: number;
}
