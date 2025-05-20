import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, DataTable } from '@/components/common';
import { taskSolutionsService } from '@/api';
import { useAuth } from '@/context/AuthContext.tsx';
import { UserRole, TaskSolutionStatus } from '@/types';

const SolutionsPage = () => {
  const { user, hasRole } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TaskSolutionStatus | 'all'>(
    'all',
  );

  // For students, show only their solutions
  // For mentors and admins, show all solutions
  const queryFn = hasRole([UserRole.ADMIN, UserRole.MENTOR])
    ? () => taskSolutionsService.getAll()
    : () =>
        user
          ? taskSolutionsService.getAllByStudentId(user.id)
          : Promise.resolve([]);

  const { data: solutions, isLoading } = useQuery({
    queryKey: [
      'solutions',
      user?.id,
      hasRole([UserRole.ADMIN, UserRole.MENTOR]),
    ],
    queryFn,
    enabled: !!user,
  });

  // Filter solutions by status if filter is active
  const filteredSolutions = solutions?.filter(
    (solution) => statusFilter === 'all' || solution.status === statusFilter,
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">
          {hasRole([UserRole.ADMIN, UserRole.MENTOR])
            ? 'All Solutions'
            : 'My Solutions'}
        </h1>
      </div>

      <Card>
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Filter by Status</span>
            </label>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TaskSolutionStatus | 'all')
              }
            >
              <option value="all">All Statuses</option>
              <option value={TaskSolutionStatus.SUBMITTED}>Submitted</option>
              <option value={TaskSolutionStatus.IN_REVIEW}>In Review</option>
              <option value={TaskSolutionStatus.REVIEWED}>Reviewed</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={[
            {
              header: 'Task',
              accessor: (row) => row.task?.title || `Task #${row.taskId}`,
            },
            hasRole([UserRole.ADMIN, UserRole.MENTOR])
              ? {
                  header: 'Student',
                  accessor: (row) =>
                    row.student?.firstName + ' ' + row.student?.lastName,
                }
              : {
                  header: 'Submitted At',
                  accessor: (row) =>
                    new Date(row.submittedAt).toLocaleDateString(),
                },
            {
              header: 'Status',
              accessor: (row) => (
                <div
                  className={`badge ${
                    row.status === TaskSolutionStatus.REVIEWED
                      ? 'badge-success'
                      : row.status === TaskSolutionStatus.IN_REVIEW
                        ? 'badge-warning'
                        : 'badge-info'
                  }`}
                >
                  {row.status}
                </div>
              ),
            },
            {
              header: 'Updated At',
              accessor: (row) => new Date(row.updatedAt).toLocaleDateString(),
            },
            {
              header: 'Actions',
              accessor: (row) => (
                <Link
                  to={`/solutions/${row.id}`}
                  className="btn btn-sm btn-primary"
                >
                  View
                </Link>
              ),
              className: 'w-24',
            },
          ]}
          data={filteredSolutions || []}
          isLoading={isLoading}
          keyExtractor={(item) => item.id.toString()}
          emptyMessage={
            hasRole([UserRole.STUDENT])
              ? "You haven't submitted any solutions yet. Go to the Tasks page to find tasks to solve."
              : 'No solutions found with the selected filters.'
          }
        />
      </Card>
    </div>
  );
};

export default SolutionsPage;
