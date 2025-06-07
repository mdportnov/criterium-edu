import { UserRole } from './user.interface';

export interface CurrentUser {
  id: string;
  role: UserRole;
}

// Export as runtime-accessible object for NX webpack compatibility
export const CurrentUser = {} as CurrentUser;
