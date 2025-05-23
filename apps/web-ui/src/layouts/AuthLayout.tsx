import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold">C</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Criterium EDU
            </h1>
          </div>
          <p className="text-muted-foreground">
            Educational Assessment Platform
          </p>
        </div>
        <div className="bg-card rounded-xl shadow-xl p-8 border border-border/50 backdrop-blur-sm fade-in transition-all duration-300 hover:shadow-2xl">
          <Outlet />
        </div>
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Criterium EDU. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
