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
  FileText,
  Home,
  ListTodo,
  LogOut,
  Menu,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { UserRole } from '@app/shared/interfaces';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

/*
 * The shell used to be a saturated blue bar with white-on-blue nav. A tool people sit
 * in all day should not have a billboard pinned to the top of every screen, so the
 * header is now the card surface with a hairline under it; the active route is marked
 * with a muted chip, and the accent is reserved for focus rings and primary actions
 * inside the page.
 */
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: Home },
    { path: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
  ];

  const studentItems =
    user?.role === UserRole.STUDENT
      ? [
          {
            path: '/dashboard/my-solutions',
            label: 'My submissions',
            icon: FileText,
          },
        ]
      : [];

  const adminItems = isAdminOrReviewer
    ? [{ path: '/dashboard/reviews', label: 'Reviews', icon: Users }]
    : [];

  const superAdminItems = hasRole([UserRole.ADMIN])
    ? [{ path: '/admin', label: 'Admin', icon: Shield }]
    : [];

  const allNavItems = [
    ...navItems,
    ...studentItems,
    ...adminItems,
    ...superAdminItems,
  ];

  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() ||
    '?';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="container-responsive max-w-[1400px]">
          <div className="flex h-12 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-6">
              <Link
                to="/dashboard"
                className="flex shrink-0 items-center gap-2 rounded text-[13px] font-semibold tracking-tight text-foreground"
              >
                <Logo />
                <span className="hidden sm:inline">Criterium</span>
                <span className="sr-only">Criterium EDU — go to overview</span>
              </Link>

              <nav
                aria-label="Main"
                className="hidden items-center gap-0.5 lg:flex"
              >
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />

              <div className="relative hidden lg:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span
                    className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground"
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span className="hidden max-w-[10rem] truncate xl:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform',
                      isUserMenuOpen && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                  >
                    <div className="border-b border-border px-3 py-2">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] text-foreground transition-colors hover:bg-muted"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="size-4 text-muted-foreground" />
                        Profile
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] text-danger transition-colors hover:bg-danger-soft"
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[17rem] p-0">
                    <SheetHeader className="border-b border-border px-4 py-3">
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>

                    <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
                        aria-hidden="true"
                      >
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <nav
                      aria-label="Main"
                      className="flex-1 overflow-y-auto p-2"
                    >
                      {allNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActiveRoute(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex min-h-11 items-center gap-2.5 rounded px-2.5 text-[13px] font-medium transition-colors',
                              active
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon className="size-4" aria-hidden="true" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </nav>

                    <div className="mt-auto border-t border-border p-2">
                      <Link
                        to="/profile"
                        className="flex min-h-11 items-center gap-2.5 rounded px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="size-4" />
                        <span>Profile</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex min-h-11 w-full items-center gap-2.5 rounded px-2.5 text-left text-[13px] font-medium text-danger transition-colors hover:bg-danger-soft"
                      >
                        <LogOut className="size-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container-responsive max-w-[1400px] py-6">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="container-responsive max-w-[1400px] py-3">
          <p className="text-xs text-muted-foreground">
            Criterium EDU · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
