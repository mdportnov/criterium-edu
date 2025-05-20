import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, DataTable, Button, Alert, Avatar } from '@/components/common';
import { usersService } from '@/api';
import { UserRole } from '@/types';
import { useToast, useAuth } from '@/hooks';

const UsersPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, loginAs } = useAuth();
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isLoggingInAs, setIsLoggingInAs] = useState<number | null>(null);

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  // Filter users by role if filter is active
  const filteredUsers = users?.filter(
    (user) => roleFilter === 'all' || user.role === roleFilter,
  );

  // Mutation for deleting a user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => usersService.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User deleted successfully!', 'success');
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      setDeleteError(
        'Failed to delete user. The user might have associated data.',
      );
    },
  });

  const handleDeleteUser = (userId: number) => {
    if (
      window.confirm(
        'Are you sure you want to delete this user? This action cannot be undone.',
      )
    ) {
      setDeleteError(null);
      deleteUserMutation.mutate(userId);
    }
  };

  const handleLoginAs = async (userId: number) => {
    try {
      setIsLoggingInAs(userId);
      await loginAs(userId);
    } catch (error) {
      console.error('Error logging in as user:', error);
      showToast('Failed to login as user', 'error');
      setIsLoggingInAs(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Users</h1>
        <Link to="/users/create" className="btn btn-primary">
          Create User
        </Link>
      </div>

      {deleteError && (
        <Alert
          variant="error"
          className="mb-6"
          onClose={() => setDeleteError(null)}
        >
          {deleteError}
        </Alert>
      )}

      <Card>
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Filter by Role</span>
            </label>
            <select
              className="select select-bordered"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as UserRole | 'all')
              }
            >
              <option value="all">All Roles</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.MENTOR}>Mentor</option>
              <option value={UserRole.STUDENT}>Student</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={[
            {
              header: 'Name',
              accessor: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar
                    firstName={row.firstName}
                    lastName={row.lastName}
                    size="sm"
                  />
                  <span>
                    {row.firstName} {row.lastName}
                  </span>
                </div>
              ),
            },
            {
              header: 'Email',
              accessor: 'email',
            },
            {
              header: 'Role',
              accessor: (row) => (
                <div
                  className={`badge ${
                    row.role === UserRole.ADMIN
                      ? 'badge-primary'
                      : row.role === UserRole.MENTOR
                        ? 'badge-secondary'
                        : 'badge-accent'
                  }`}
                >
                  {row.role}
                </div>
              ),
            },
            {
              header: 'Created',
              accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
            },
            {
              header: 'Actions',
              accessor: (row) => (
                <div className="flex gap-2">
                  <Link
                    to={`/users/${row.id}/edit`}
                    className="btn btn-sm btn-secondary"
                  >
                    Edit
                  </Link>
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleDeleteUser(row.id)}
                  >
                    Delete
                  </Button>
                  {/* Admin can login as any user except themselves */}
                  {user?.role === UserRole.ADMIN && user.id !== row.id && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLoginAs(row.id)}
                      isLoading={isLoggingInAs === row.id}
                    >
                      Login As
                    </Button>
                  )}
                </div>
              ),
              className: 'w-40',
            },
          ]}
          data={filteredUsers || []}
          isLoading={isLoading}
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No users found with the selected filters."
        />
      </Card>
    </div>
  );
};

export default UsersPage;
