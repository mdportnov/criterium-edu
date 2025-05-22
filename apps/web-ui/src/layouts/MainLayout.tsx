import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

// Hamburger menu icon
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

// X close icon
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MainLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const isAdminOrMentor = hasRole([UserRole.ADMIN, UserRole.MENTOR]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Criterium EDU
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:underline">Dashboard</Link>
            <Link to="/tasks" className="hover:underline">Tasks</Link>
            <Link to="/checker" className="hover:underline">Code Checker</Link>
            
            {user?.role === UserRole.STUDENT && (
              <Link to="/my-solutions" className="hover:underline">My Submissions</Link>
            )}
            
            {isAdminOrMentor && (
              <>
                <Link to="/admin/reviews" className="hover:underline">Reviews</Link>
                <Link to="/admin/bulk-import" className="hover:underline">Bulk Import</Link>
                {hasRole(UserRole.ADMIN) && (
                  <Link to="/admin/tasks/create" className="hover:underline">Create Task</Link>
                )}
              </>
            )}
            
            {/* User dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 hover:underline">
                {user?.firstName} {user?.lastName}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg hidden group-hover:block z-10">
                <div className="py-1">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-muted">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-muted text-destructive"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile Menu Button - Only visible on mobile */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground">
                  <MenuIcon />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[280px] sm:w-[350px] bg-background border-l border-border p-0"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <CloseIcon />
                        <span className="sr-only">Close</span>
                      </Button>
                    </SheetClose>
                  </div>
                  
                  <div className="flex-1 overflow-auto">
                    <div className="p-4 flex flex-col space-y-1">
                      <Link 
                        to="/" 
                        className="px-2 py-3 text-foreground hover:bg-muted rounded-md"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/tasks" 
                        className="px-2 py-3 text-foreground hover:bg-muted rounded-md"
                        onClick={() => setIsOpen(false)}
                      >
                        Tasks
                      </Link>
                      <Link 
                        to="/checker" 
                        className="px-2 py-3 text-foreground hover:bg-muted rounded-md"
                        onClick={() => setIsOpen(false)}
                      >
                        Code Checker
                      </Link>
                      
                      {user?.role === UserRole.STUDENT && (
                        <Link 
                          to="/my-solutions" 
                          className="px-2 py-3 text-foreground hover:bg-muted rounded-md"
                          onClick={() => setIsOpen(false)}
                        >
                          My Submissions
                        </Link>
                      )}
                      
                      {isAdminOrMentor && (
                        <>
                          <Link 
                            to="/admin/reviews" 
                            className="px-2 py-3 text-foreground hover:bg-muted rounded-md"
                            onClick={() => setIsOpen(false)}
                          >
                            Reviews
                          </Link>
                          <Link 
                            to="/admin/bulk-import" 
                            className="px-2 py-3 text-foreground hover:bg-muted rounded-md"
                            onClick={() => setIsOpen(false)}
                          >
                            Bulk Import
                          </Link>
                          {hasRole(UserRole.ADMIN) && (
                            <Link 
                              to="/admin/tasks/create" 
                              className="px-2 py-3 text-foreground hover:bg-muted rounded-md"
                              onClick={() => setIsOpen(false)}
                            >
                              Create Task
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t p-4">
                    <Link 
                      to="/profile" 
                      className="block px-2 py-3 text-foreground hover:bg-muted rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2 py-3 text-destructive hover:bg-muted rounded-md mt-1"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-muted py-4">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Criterium EDU. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
