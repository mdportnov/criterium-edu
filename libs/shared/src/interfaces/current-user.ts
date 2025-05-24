import { UserRole } from './user.interface';

export interface CurrentUser {
  id: number;
  role: UserRole;
}
