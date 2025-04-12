import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title,
  subtitle 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-base-100 p-8 rounded-box shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
};
