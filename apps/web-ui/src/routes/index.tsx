import React from 'react';
import {
  createBrowserRouter,
  type RouteObject,
  RouterProvider,
} from 'react-router-dom';
import ProtectedRoute from '@/components/router/ProtectedRoute';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Public pages
import { LandingPage } from '@/features/landing';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import NotFoundPage from '@/features/common/pages/NotFoundPage';
import UnauthorizedPage from '@/features/common/pages/UnauthorizedPage';

// Protected pages
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import TasksPage from '@/features/tasks/pages/TasksPage';
import TaskDetailPage from '@/features/tasks/pages/TaskDetailPage';
import CreateTaskPage from '@/features/tasks/pages/CreateTaskPage';
import EditTaskPage from '@/features/tasks/pages/EditTaskPage';
import {
  MySubmissionsPage,
  ReviewSolutionPage,
  SolutionDetailPage,
  SubmitSolutionPage,
} from '@/features/solutions';
import { CheckerPage } from '@/features/checker';
import { BulkImportPage } from '@/features/bulk-operations';
import {
  CreateReviewPage,
  ReviewDetailPage,
  ReviewsPage,
} from '@/features/reviews';
import BulkSolutionUploadPage from '@/features/reviews/pages/BulkSolutionUploadPage';
import ProcessingOperationPage from '@/features/reviews/pages/ProcessingOperationPage';
import LLMProcessingPage from '@/features/reviews/pages/LLMProcessingPage';
import ReviewApprovalDashboard from '@/features/reviews/pages/ReviewApprovalDashboard';
import ProcessingStatusPage from '@/features/reviews/pages/ProcessingStatusPage';
import { AdminPanelPage } from '@/features/admin';
import { UserRole } from '@app/shared';

// Dashboard pages (protected routes under /dashboard)
const dashboardPages: RouteObject[] = [
  { index: true, element: <DashboardPage /> }, // /dashboard
  { path: 'tasks', element: <TasksPage /> }, // /dashboard/tasks
  { path: 'tasks/:id', element: <TaskDetailPage /> }, // /dashboard/tasks/:id
  { path: 'tasks/:taskId/submit-solution', element: <SubmitSolutionPage /> }, // /dashboard/tasks/:taskId/submit-solution
  { path: 'checker', element: <CheckerPage /> }, // /dashboard/checker
  { path: 'my-solutions', element: <MySubmissionsPage /> }, // /dashboard/my-solutions
  { path: 'solutions/:id', element: <SolutionDetailPage /> }, // /dashboard/solutions/:id
  { path: 'reviews', element: <ReviewsPage /> }, // /dashboard/reviews
  { path: 'reviews/create', element: <CreateReviewPage /> }, // /dashboard/reviews/create
  { path: 'reviews/:id', element: <ReviewDetailPage /> }, // /dashboard/reviews/:id
  { path: 'reviews/bulk-upload', element: <BulkSolutionUploadPage /> }, // /dashboard/reviews/bulk-upload
  { path: 'reviews/processing/:operationId', element: <ProcessingOperationPage /> }, // /dashboard/reviews/processing/:operationId
  { path: 'reviews/llm-processing', element: <LLMProcessingPage /> }, // /dashboard/reviews/llm-processing
  { path: 'reviews/approval-dashboard', element: <ReviewApprovalDashboard /> }, // /dashboard/reviews/approval-dashboard
  { path: 'reviews/processing-status', element: <ProcessingStatusPage /> }, // /dashboard/reviews/processing-status
  { path: 'bulk-import', element: <BulkImportPage /> }, // /dashboard/bulk-import
  { path: 'tasks/create', element: <CreateTaskPage /> }, // /dashboard/tasks/create
  { path: 'tasks/:id/edit', element: <EditTaskPage /> }, // /dashboard/tasks/:id/edit
  { path: 'solutions/:solutionId/review', element: <ReviewSolutionPage /> }, // /dashboard/solutions/:solutionId/review
];

// Admin pages (protected routes under /admin, admin only)
const adminPages: RouteObject[] = [
  { index: true, element: <AdminPanelPage /> }, // /admin
];

// Router Configuration
const router = createBrowserRouter([
  // Public root route
  {
    path: '/',
    element: <LandingPage />,
  },
  // Public Auth Routes (wrapped in AuthLayout)
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  // Profile route (protected but at root level)
  {
    path: '/profile',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [{ index: true, element: <ProfilePage /> }],
      },
    ],
  },
  // Dashboard Protected Routes (all main functionality under /dashboard)
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.REVIEWER]} />
    ),
    children: [
      {
        element: <MainLayout />,
        children: dashboardPages,
      },
    ],
  },
  // Admin Protected Routes (admin only)
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />
    ),
    children: [
      {
        element: <MainLayout />,
        children: adminPages,
      },
    ],
  },
  // Top-level utility pages
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
