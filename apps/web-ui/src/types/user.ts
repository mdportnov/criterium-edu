import { UserRole } from '@app/shared';

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: UserRole;
}
