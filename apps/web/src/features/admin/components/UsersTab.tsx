import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import {
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Activity, Search, User, X } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AdminUser, GetUsersParams } from '@/types/admin';
import { UserRole } from '@app/shared/interfaces';
import { UserActivityModal } from './UserActivityModal';

const ALL = '__all__';

export const UsersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<GetUsersParams>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUserActivityOpen, setIsUserActivityOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminService.getUsers(params),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((prev) => ({
        ...prev,
        search: searchInput || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setParams((prev) => ({
      ...prev,
      role: role === ALL ? undefined : (role as UserRole),
      page: 1,
    }));
  };

  const hasFilters = Boolean(searchInput) || roleFilter !== ALL;

  const clearFilters = () => {
    setSearchInput('');
    setRoleFilter(ALL);
    setParams((prev) => ({
      ...prev,
      search: undefined,
      role: undefined,
      page: 1,
    }));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const handleViewActivity = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUserActivityOpen(true);
  };

  const handleCloseActivity = () => {
    setIsUserActivityOpen(false);
    setSelectedUser(null);
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUserId(null);
    },
    onError: (err) => {
      console.error('Failed to update user role:', err);
    },
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load users"
        message="The admin service did not respond."
        onRetry={refetch}
      />
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by email or name"
            aria-label="Search users"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={roleFilter} onValueChange={handleRoleFilter}>
          <SelectTrigger aria-label="Role" className="sm:w-[10rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
            <SelectItem value={UserRole.REVIEWER}>Reviewer</SelectItem>
            <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={User}
          title={hasFilters ? 'No users match these filters' : 'No users yet'}
          description={
            hasFilters
              ? 'Try a shorter search term, or clear the role filter.'
              : 'Registered users will appear here.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <tr>
                <Th className="min-w-[16rem]">User</Th>
                <Th className="w-40">Role</Th>
                <Th className="hidden sm:table-cell">Joined</Th>
                <Th className="w-px text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {data?.data.map((user: AdminUser) => (
                <Tr key={user.id}>
                  <Td>
                    <p className="font-medium text-foreground">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'No name'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </Td>
                  <Td>
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-1">
                        <Select
                          value={user.role}
                          onValueChange={(newRole: UserRole) =>
                            handleRoleChange(user.id, newRole)
                          }
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.STUDENT}>
                              Student
                            </SelectItem>
                            <SelectItem value={UserRole.REVIEWER}>
                              Reviewer
                            </SelectItem>
                            <SelectItem value={UserRole.ADMIN}>
                              Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingUserId(null)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <X className="size-3.5" />
                          <span className="sr-only">Cancel</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={user.role} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUserId(user.id)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <time
                      dateTime={user.createdAt}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDate(user.createdAt)}
                    </time>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewActivity(user)}
                    >
                      <Activity className="size-3.5" />
                      Activity
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {!isLoading && data && data.total > 0 && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          pageSize={data.limit}
          total={data.total}
          onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) =>
            setParams((prev) => ({ ...prev, limit, page: 1 }))
          }
        />
      )}

      {selectedUser && (
        <UserActivityModal
          isOpen={isUserActivityOpen}
          onClose={handleCloseActivity}
          userId={selectedUser.id}
          userName={
            selectedUser.firstName && selectedUser.lastName
              ? `${selectedUser.firstName} ${selectedUser.lastName}`
              : 'No name'
          }
          userEmail={selectedUser.email}
        />
      )}
    </Card>
  );
};
