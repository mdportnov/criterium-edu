import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-6xl font-bold text-destructive">403</h1>
      <h2 className="text-2xl font-semibold mt-4 mb-6">Access Denied</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        You don't have permission to access this page. Please contact an
        administrator if you believe this is an error.
      </p>
      <Button asChild>
        <Link to="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
