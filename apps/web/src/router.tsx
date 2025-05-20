import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';
import { Layout } from './components/layout';
import { UserRole } from './types';

// Lazy loading pages for better performance
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage.tsx'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage.tsx'));
const DashboardPage = React.lazy(
  () => import('./pages/dashboard/DashboardPage.tsx'),
);
const TasksPage = React.lazy(() => import('./pages/tasks/TasksPage.tsx'));
const TaskDetailPage = React.lazy(
  () => import('./pages/tasks/TaskDetailPage.tsx'),
);
const TaskCreatePage = React.lazy(
  () => import('./pages/tasks/TaskCreatePage.tsx'),
);
const TaskEditPage = React.lazy(() => import('./pages/tasks/TaskEditPage.tsx'));
const SolutionsPage = React.lazy(
  () => import('./pages/solutions/SolutionsPage.tsx'),
);
const SolutionDetailPage = React.lazy(
  () => import('./pages/solutions/SolutionDetailPage.tsx'),
);
const ReviewsPage = React.lazy(() => import('./pages/reviews/ReviewsPage.tsx'));
const ReviewDetailPage = React.lazy(
  () => import('./pages/reviews/ReviewDetailPage.tsx'),
);
const UsersPage = React.lazy(() => import('./pages/users/UsersPage.tsx'));
const UserCreatePage = React.lazy(
  () => import('./pages/users/UserCreatePage.tsx'),
);
const UserEditPage = React.lazy(() => import('./pages/users/UserEditPage.tsx'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage.tsx'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage.tsx'));

// Higher Order Component for protected routes
const ProtectedRoute = ({
  children,
  requiredRoles = [],
}: {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}) => {
  const { isAuthenticated, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Higher Order Component for auth routes (accessible only when not authenticated)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Component for lazy loaded pages with Suspense fallback
const LazyOutlet = () => {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <Outlet />
    </React.Suspense>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <AuthRoute>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LoginPage />
        </React.Suspense>
      </AuthRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthRoute>
        <React.Suspense fallback={<div>Loading...</div>}>
          <RegisterPage />
        </React.Suspense>
      </AuthRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <Layout>
          <LazyOutlet />
        </Layout>
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/tasks',
        element: <TasksPage />,
      },
      {
        path: '/tasks/:taskId',
        element: <TaskDetailPage />,
      },
      {
        path: '/tasks/create',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MENTOR]}>
            <TaskCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/tasks/:taskId/edit',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MENTOR]}>
            <TaskEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/solutions',
        element: <SolutionsPage />,
      },
      {
        path: '/solutions/:solutionId',
        element: <SolutionDetailPage />,
      },
      {
        path: '/reviews',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MENTOR]}>
            <ReviewsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reviews/:reviewId',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MENTOR]}>
            <ReviewDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/users/create',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
            <UserCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/users/:userId/edit',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
            <UserEditPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <React.Suspense fallback={<div>Loading...</div>}>
        <NotFoundPage />
      </React.Suspense>
    ),
  },
]);
