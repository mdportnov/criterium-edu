import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, UserRole } from '@/types';
import { AuthService } from '@/services/auth.service';
import { UserService } from '@/services/user.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

// Mock user for development
const mockUser: User = {
  id: 1,
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.ADMIN,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null); // Start with no user
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Start not authenticated

  useEffect(() => {
    const checkAuthStatus = async () => {
      // setIsLoading(true); // Already true from initial state

      if (import.meta.env.PROD && AuthService.isAuthenticated()) {
        try {
          const userData = await UserService.getProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          AuthService.logout(); // Clear token if profile fetch fails
          setUser(null);
          setIsAuthenticated(false);
        }
      } else if (!import.meta.env.PROD) {
        // For development, set mock user but DON'T auto-authenticate
        // This allows visiting /login page.
        // The mockUser can be used by other parts of the app that might expect a user object.
        setUser(mockUser); 
        // setIsAuthenticated(true); // DO NOT set this to true here for dev
      }
      // If it's PROD and no token, user remains null, isAuthenticated remains false.
      
      setIsLoading(false); // Finished initial auth check
    };

    checkAuthStatus();
  }, []); // Empty dependency array, runs once on mount

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (import.meta.env.PROD) {
        const response = await AuthService.login({ email, password });
        localStorage.setItem('token', response.access_token);
        const userData = await UserService.getProfile();
        setUser(userData);
      } else {
        // Mock login for development
        setUser(mockUser);
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
  ) => {
    setIsLoading(true);
    try {
      if (import.meta.env.PROD) {
        const response = await AuthService.register({
          email,
          firstName,
          lastName,
          password,
        });
        localStorage.setItem('token', response.access_token);
        const userData = await UserService.getProfile();
        setUser(userData);
      } else {
        // Mock register for development
        setUser({
          ...mockUser,
          email,
          firstName,
          lastName,
        });
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }

    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
