import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '@/api';
import { JwtPayload, LoginPayload, RegisterPayload, User, UserRole, LoginAsPayload } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  originalAdmin?: { id: number };
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  loginAs: (userId: number) => Promise<void>;
  stopImpersonating: () => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<{ id: number } | undefined>(undefined);
  
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const decoded = jwtDecode<JwtPayload>(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error('Token expired');
          }
          
          setUser({
            id: decoded.sub,
            email: decoded.email,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            role: decoded.role,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Check if this is an impersonation session
          if (decoded.impersonatedBy) {
            setIsImpersonating(true);
            setOriginalAdmin({ id: decoded.impersonatedBy });
          } else {
            setIsImpersonating(false);
            setOriginalAdmin(undefined);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  const login = async (data: LoginPayload) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('accessToken', response.access_token);
      
      const decoded = jwtDecode<JwtPayload>(response.access_token);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const register = async (data: RegisterPayload) => {
    try {
      const response = await authService.register(data);
      localStorage.setItem('accessToken', response.access_token);
      
      const decoded = jwtDecode<JwtPayload>(response.access_token);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: UserRole.STUDENT, // New users are always students by default
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  const loginAs = async (userId: number) => {
    try {
      const response = await authService.loginAs({ userId });
      localStorage.setItem('accessToken', response.access_token);
      
      const decoded = jwtDecode<JwtPayload>(response.access_token);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Set impersonation status
      if (decoded.impersonatedBy) {
        setIsImpersonating(true);
        setOriginalAdmin({ id: decoded.impersonatedBy });
      }

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login as error:', error);
      throw error;
    }
  };

  const stopImpersonating = () => {
    // Remove the impersonation token
    localStorage.removeItem('accessToken');
    setIsImpersonating(false);
    setUser(null);
    setOriginalAdmin(undefined);
    // Redirect to users page
    window.location.href = '/users';
  };
  
  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsImpersonating(false);
    setOriginalAdmin(undefined);
    // Redirect to login
    window.location.href = '/login';
  };
  
  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isImpersonating,
        originalAdmin,
        login,
        register,
        loginAs,
        stopImpersonating,
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

