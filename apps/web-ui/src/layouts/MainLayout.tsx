import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const MainLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminOrMentor = hasRole([UserRole.ADMIN, UserRole.MENTOR]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Criterium EDU
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
            <Link to="/tasks" className="hover:underline">
              Tasks
            </Link>
            <Link to="/checker" className="hover:underline">
              Code Checker
            </Link>

            {user?.role === UserRole.STUDENT && (
              <Link to="/my-solutions" className="hover:underline">
                My Submissions
              </Link>
            )}

            {isAdminOrMentor && (
              <>
                <Link to="/admin/reviews" className="hover:underline">
                  Reviews
                </Link>
                <Link to="/admin/bulk-import" className="hover:underline">
                  Bulk Import
                </Link>
                {hasRole(UserRole.ADMIN) && (
                  <Link to="/admin/create-task" className="hover:underline">
                    Create Task
                  </Link>
                )}
              </>
            )}

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
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-muted"
                  >
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
