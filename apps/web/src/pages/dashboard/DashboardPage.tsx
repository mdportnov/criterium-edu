import { useQuery } from '@tanstack/react-query';
import { Card, DataTable } from '@/components/common';
import { useAuth } from '@/context/AuthContext.tsx';
import { UserRole } from '@/types';
import { tasksService, taskSolutionsService } from '@/api';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();

  // Fetch tasks for display
  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll(),
  });

  // Fetch user's solutions if user is a student
  const { data: solutions, isLoading: isSolutionsLoading } = useQuery({
    queryKey: ['solutions', user?.id],
    queryFn: () =>
      user
        ? taskSolutionsService.getAllByStudentId(user.id)
        : Promise.resolve([]),
    enabled: user?.role === UserRole.STUDENT,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card className="bg-primary text-white shadow-md hover:shadow-lg transition-shadow dark:bg-primary-focus">
          <div className="flex flex-col">
            <div className="text-xl font-semibold mb-2 text-white">
              Total Tasks
            </div>
            <div className="text-4xl font-bold">
              {isTasksLoading ? (
                <div className="h-10 flex items-center">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : (
                tasks?.length || 0
              )}
            </div>
          </div>
        </Card>

        {user?.role === UserRole.STUDENT && (
          <Card className="bg-accent text-black shadow-md hover:shadow-lg transition-shadow dark:bg-accent-focus">
            <div className="flex flex-col">
              <div className="text-xl font-semibold mb-2 text-black">
                My Solutions
              </div>
              <div className="text-4xl font-bold">
                {isSolutionsLoading ? (
                  <div className="h-10 flex items-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : (
                  solutions?.length || 0
                )}
              </div>
            </div>
          </Card>
        )}

        {(user?.role === UserRole.ADMIN || user?.role === UserRole.MENTOR) && (
          <Card className="bg-secondary text-white shadow-md hover:shadow-lg transition-shadow dark:bg-secondary-focus">
            <div className="flex flex-col">
              <div className="text-xl font-semibold mb-2 text-white">
                Pending Reviews
              </div>
              <div className="text-4xl font-bold">
                {/* This would ideally be a separate query */}
                <span>0</span>
              </div>
            </div>
          </Card>
        )}

        {user?.role === UserRole.ADMIN && (
          <Card className="bg-info text-white shadow-md hover:shadow-lg transition-shadow dark:bg-info-focus">
            <div className="flex flex-col">
              <div className="text-xl font-semibold mb-2 text-white">Users</div>
              <div className="text-4xl font-bold">
                {/* This would ideally be a separate query */}
                <span>0</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Tasks Section */}
      <div className="mt-8">
        <Card
          title={
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Tasks
            </h2>
          }
          actions={
            <Link to="/tasks" className="btn btn-sm btn-ghost">
              View All
            </Link>
          }
        >
          {isTasksLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : tasks && tasks.length > 0 ? (
            <DataTable
              columns={[
                { header: 'Title', accessor: 'title' },
                {
                  header: 'Created At',
                  accessor: (row) =>
                    new Date(row.createdAt).toLocaleDateString(),
                },
                {
                  header: 'Actions',
                  accessor: (row) => (
                    <Link
                      to={`/tasks/${row.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      View
                    </Link>
                  ),
                },
              ]}
              data={tasks.slice(0, 5)} // Show only the 5 most recent tasks
              keyExtractor={(item) => item.id.toString()}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-base-content">No tasks available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Solutions Section for Student */}
      {user?.role === UserRole.STUDENT && (
        <div className="mt-8">
          <Card
            title={
              <h2 className="text-xl font-semibold text-gray-800">
                My Recent Solutions
              </h2>
            }
            actions={
              <Link to="/solutions" className="btn btn-sm btn-ghost">
                View All
              </Link>
            }
          >
            {isSolutionsLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : solutions && solutions.length > 0 ? (
              <DataTable
                columns={[
                  {
                    header: 'Task',
                    accessor: (row) => row.task?.title || `Task #${row.taskId}`,
                  },
                  {
                    header: 'Status',
                    accessor: (row) => (
                      <div className="badge badge-outline">{row.status}</div>
                    ),
                  },
                  {
                    header: 'Submitted At',
                    accessor: (row) =>
                      new Date(row.submittedAt).toLocaleDateString(),
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
                  },
                ]}
                data={solutions.slice(0, 5)} // Show only the 5 most recent solutions
                keyExtractor={(item) => item.id.toString()}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-base-content">No solutions submitted yet</p>
                <Link to="/tasks" className="btn btn-primary mt-4">
                  Browse Tasks
                </Link>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Quick Links Section */}
      <div className="mt-8">
        <Card
          title={
            <h2 className="text-xl font-semibold text-gray-800">Quick Links</h2>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/tasks" className="btn btn-outline btn-primary">
              Browse Tasks
            </Link>

            {user?.role === UserRole.STUDENT && (
              <Link to="/solutions" className="btn btn-outline btn-accent">
                My Solutions
              </Link>
            )}

            {(user?.role === UserRole.ADMIN ||
              user?.role === UserRole.MENTOR) && (
              <Link to="/reviews" className="btn btn-outline btn-secondary">
                Reviews
              </Link>
            )}

            {user?.role === UserRole.ADMIN && (
              <Link to="/users" className="btn btn-outline btn-info">
                Manage Users
              </Link>
            )}

            <Link to="/profile" className="btn btn-outline">
              My Profile
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
