import React from 'react';
import { useAuth } from '@/hooks';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, stopImpersonating, user } = useAuth();

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-warning text-warning-content py-2 px-4 text-center">
      <p className="text-sm font-medium">
        You are currently logged in as {user?.firstName} {user?.lastName} ({user?.email}). 
        <button 
          onClick={stopImpersonating}
          className="ml-2 underline font-semibold hover:text-warning-content/80"
        >
          Return to admin account
        </button>
      </p>
    </div>
  );
};
