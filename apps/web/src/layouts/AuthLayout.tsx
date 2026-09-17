import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/states';

/*
 * Sign-in is the one screen a first-time user meets, but it is still the front door of
 * an internal tool, not a landing page: a plain surface, a single card, no gradient
 * wash and no hover lift on the card.
 */
const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <img src="/logo.svg" alt="" className="size-6" aria-hidden="true" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Criterium EDU
          </span>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <Outlet />
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Internal assessment tool · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
