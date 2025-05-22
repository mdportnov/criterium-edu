import React from 'react';
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/router/ProtectedRoute';
import { UserRole } from '@/types';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Public pages
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import NotFoundPage from '@/features/common/pages/NotFoundPage';
import UnauthorizedPage from '@/features/common/pages/UnauthorizedPage';

// Common Protected pages (rendered within MainLayout)
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import TasksPage from '@/features/tasks/pages/TasksPage';
import TaskDetailPage from '@/features/tasks/pages/TaskDetailPage';
import { MySubmissionsPage, SubmitSolutionPage, SolutionDetailPage, ReviewSolutionPage as UserReviewSolutionPage } from '@/features/solutions'; // Renamed ReviewSolutionPage to avoid conflict if admin one exists
import { CheckerPage } from '@/features/checker';

// Admin Protected pages (rendered within MainLayout under /admin)
import CreateTaskPage from '@/features/tasks/pages/CreateTaskPage';
import EditTaskPage from '@/features/tasks/pages/EditTaskPage';
import { BulkImportPage } from '@/features/bulk-operations';
// Assuming ReviewSolutionPage from features/solutions might be admin-specific or have an admin version.
// For this example, I'm using UserReviewSolutionPage for the common user path and will assume ReviewSolutionPage is for admin or not used here.
// If ReviewSolutionPage is admin-specific, it will be in adminPages.
// For now, let's assume the ReviewSolutionPage imported from '@/features/solutions' is the one for admin path /admin/solutions/:solutionId/review
import { ReviewSolutionPage as AdminReviewSolutionPage } from '@/features/solutions'; // Example if it's specifically for admin and distinct

// --- Page Group Definitions ---

const commonPages: RouteObject[] = [
  { index: true, element: <DashboardPage /> }, // Default for '/'
  { path: 'dashboard', element: <DashboardPage /> }, // Explicit path
  { path: 'profile', element: <ProfilePage /> },
  { path: 'tasks', element: <TasksPage /> },
  { path: 'tasks/:id', element: <TaskDetailPage /> },
  { path: 'my-solutions', element: <MySubmissionsPage /> },
  { path: 'solutions/:id', element: <SolutionDetailPage /> },
  { path: 'tasks/:taskId/submit-solution', element: <SubmitSolutionPage /> },
  { path: 'checker', element: <CheckerPage /> },
  // UnauthorizedPage is now top-level, but if it needs MainLayout and protection context, it can be here.
  // For now, keeping it top-level means redirection to /unauthorized will show it without MainLayout.
];

const adminPages: RouteObject[] = [
  // Paths are relative to '/admin'
  // Example: { index: true, element: <AdminDashboardPage /> }, // If you have an admin dashboard
  { path: 'tasks/create', element: <CreateTaskPage /> },
  { path: 'tasks/:id/edit', element: <EditTaskPage /> },
  { path: 'bulk-import', element: <BulkImportPage /> },
  { path: 'solutions/:solutionId/review', element: <AdminReviewSolutionPage /> }, // Or simply ReviewSolutionPage if it's the admin one
  // Add other admin-specific pages here, e.g., an admin reviews management page
  // { path: 'reviews', element: <div>Admin Reviews Page (Coming Soon)</div> },
];

// --- Router Configuration ---

const router = createBrowserRouter([
  // Public Auth Routes (wrapped in AuthLayout)
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  // General Protected Routes (wrapped in ProtectedRoute, then MainLayout)
  {
    path: '/', // Base for common authenticated routes
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: commonPages,
      },
    ],
  },
  // Admin Protected Routes (wrapped in Admin ProtectedRoute, then MainLayout)
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
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
