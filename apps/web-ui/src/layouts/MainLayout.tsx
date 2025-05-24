import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ChevronDown,
  Code2,
  FileText,
  Home,
  ListTodo,
  LogOut,
  Menu,
  User,
  Users,
} from 'lucide-react';
import { UserRole } from '@app/shared';

const MainLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const isAdminOrReviewer = hasRole([UserRole.ADMIN, UserRole.REVIEWER]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if a route is active
  const isActiveRoute = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/dashboard/tasks', label: 'Tasks', icon: ListTodo }
  ];

  const studentItems =
    user?.role === UserRole.STUDENT
      ? [
          {
            path: '/dashboard/my-solutions',
            label: 'My Submissions',
            icon: FileText,
          },
        ]
      : [];

  const adminItems = isAdminOrReviewer
    ? [
        { path: '/dashboard/reviews', label: 'Reviews', icon: Users },
        { path: '/dashboard/checker', label: 'Code Checker', icon: Code2 },
      ]
    : [];

  const allNavItems = [...navItems, ...studentItems, ...adminItems];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-40 transition-all duration-300 backdrop-blur-none">
        <div className="container-responsive max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="text-xl font-bold hover:opacity-80 transition-opacity duration-200 flex items-center gap-2"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.svg" alt="Criterium EDU" className="w-8 h-8" />
              </div>
              <span className="hidden sm:inline">Criterium EDU</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                      isActiveRoute(item.path)
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* User dropdown */}
              <div className="relative ml-4" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden xl:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 text-red-600 dark:text-red-400 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                  >
                    <Menu className="w-6 h-6" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[350px] p-0"
                >
                  <SheetHeader className="p-6 pb-4 border-b">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>

                  {/* User info in mobile menu */}
                  <div className="p-6 pt-4 pb-4 bg-muted/50 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-lg">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation items */}
                  <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-4 space-y-1">
                      {allNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveRoute(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-foreground hover:bg-muted'
                            }`}
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Mobile menu footer */}
                  <div className="border-t p-4 space-y-1 mt-auto">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors duration-200 text-destructive w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-background">
        <div className="container-responsive max-w-7xl mx-auto py-6 sm:py-8 lg:py-10 fade-in">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t border-border mt-auto">
        <div className="container-responsive max-w-7xl mx-auto py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <img src="/logo.svg" alt="Criterium EDU" className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Criterium EDU. All rights
                reserved.
              </p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Educational Platform for Excellence</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
