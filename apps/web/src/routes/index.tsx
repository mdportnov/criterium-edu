import React from 'react';
import {
  createBrowserRouter,
  type RouteObject,
  RouterProvider,
} from 'react-router-dom';
import ProtectedRoute from '@/components/router/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { UserRole } from '@app/shared/interfaces/user.interface';

/**
 * Routes load their page on first visit rather than up front. The whole app
 * used to ship as one bundle, so every visitor downloaded the admin panel and
 * the bulk-import screens to look at a login form.
 *
 * `lazy` returns the route module; these pages are default exports, so each
 * one is unwrapped here.
 */
const page =
  (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
    Component: (await load()).default,
  });

const dashboardPages: RouteObject[] = [
  {
    index: true,
    lazy: page(() => import('@/features/dashboard/pages/DashboardPage')),
  },
  {
    path: 'tasks',
    lazy: page(() => import('@/features/tasks/pages/TasksPage')),
  },
  {
    path: 'tasks/create',
    lazy: page(() => import('@/features/tasks/pages/CreateTaskPage')),
  },
  {
    path: 'tasks/:id',
    lazy: page(() => import('@/features/tasks/pages/TaskDetailPage')),
  },
  {
    path: 'tasks/:id/edit',
    lazy: page(() => import('@/features/tasks/pages/EditTaskPage')),
  },
  {
    path: 'tasks/:taskId/submit-solution',
    lazy: page(() => import('@/features/solutions/pages/SubmitSolutionPage')),
  },
  {
    path: 'my-solutions',
    lazy: page(() => import('@/features/solutions/pages/MySubmissionsPage')),
  },
  {
    path: 'solutions/:id',
    lazy: page(() => import('@/features/solutions/pages/SolutionDetailPage')),
  },
  {
    path: 'solutions/:solutionId/review',
    lazy: page(() => import('@/features/solutions/pages/ReviewSolutionPage')),
  },
  {
    path: 'reviews',
    lazy: page(() => import('@/features/reviews/pages/ReviewsPage')),
  },
  {
    path: 'reviews/create',
    lazy: page(() => import('@/features/reviews/pages/CreateReviewPage')),
  },
  {
    path: 'reviews/bulk-upload',
    lazy: page(() => import('@/features/reviews/pages/BulkSolutionUploadPage')),
  },
  {
    path: 'reviews/llm-processing',
    lazy: page(() => import('@/features/reviews/pages/LLMProcessingPage')),
  },
  {
    path: 'reviews/approval-dashboard',
    lazy: page(
      () => import('@/features/reviews/pages/ReviewApprovalDashboard'),
    ),
  },
  {
    path: 'reviews/processing-status',
    lazy: page(() => import('@/features/reviews/pages/ProcessingStatusPage')),
  },
  {
    path: 'reviews/processing/:operationId',
    lazy: page(
      () => import('@/features/reviews/pages/ProcessingOperationPage'),
    ),
  },
  {
    path: 'reviews/:id',
    lazy: page(() => import('@/features/reviews/pages/ReviewDetailPage')),
  },
  {
    path: 'bulk-import',
    lazy: page(() => import('@/features/bulk-operations/pages/BulkImportPage')),
  },
];

const router = createBrowserRouter([
  {
    path: '/',
    lazy: page(() => import('@/features/landing/pages/LandingPage')),
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        lazy: page(() => import('@/features/auth/pages/LoginPage')),
      },
      {
        path: 'register',
        lazy: page(() => import('@/features/auth/pages/RegisterPage')),
      },
      {
        // Redeems the one-time link an administrator issues for an account
        // that has never had a password of its own.
        path: 'set-password',
        lazy: page(() => import('@/features/auth/pages/SetPasswordPage')),
      },
    ],
  },
  {
    path: '/profile',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            lazy: page(() => import('@/features/profile/pages/ProfilePage')),
          },
        ],
      },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.REVIEWER]} />
    ),
    children: [{ element: <MainLayout />, children: dashboardPages }],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            lazy: page(() => import('@/features/admin/pages/AdminPanelPage')),
          },
        ],
      },
    ],
  },
  {
    path: '/unauthorized',
    lazy: page(() => import('@/features/common/pages/UnauthorizedPage')),
  },
  {
    path: '*',
    lazy: page(() => import('@/features/common/pages/NotFoundPage')),
  },
]);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
