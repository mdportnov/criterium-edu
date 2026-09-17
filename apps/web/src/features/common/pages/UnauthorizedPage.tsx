import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        403
      </p>
      <h1 className="mt-2 text-lg font-semibold text-foreground">
        Access denied
      </h1>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
        You don't have permission to access this page. Contact an administrator
        if you believe this is a mistake.
      </p>
      <Button asChild className="mt-5">
        <Link to="/dashboard">Back to overview</Link>
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
