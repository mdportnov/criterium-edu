import React from 'react';
import { Navbar } from './Navbar.tsx';
import { Footer } from './Footer.tsx';
import { useAuth } from '@/context/AuthContext.tsx';
import { ThemeProvider } from '@/context/ThemeContext';
import { ImpersonationBanner } from '@/components/common';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        <ImpersonationBanner />
        <Navbar />
        <main className="flex-grow container-fluid mx-auto py-8">
          {children}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};
