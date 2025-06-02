import { UserRole } from './user.interface';

export interface CurrentUser {
  id: string;
  role: UserRole;
}
