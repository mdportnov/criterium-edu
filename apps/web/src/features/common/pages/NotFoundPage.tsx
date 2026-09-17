import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-lg font-semibold text-foreground">
        Page not found
      </h1>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-5">
        <Link to="/dashboard">Back to overview</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
