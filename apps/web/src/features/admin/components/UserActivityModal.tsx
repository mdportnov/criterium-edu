import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Pagination } from '@/components/ui/pagination';
import {
  Activity,
  Edit,
  Eye,
  FilePlus,
  LogIn,
  LogOut,
  Shield,
  Trash2,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AuditLog, GetUserActivityParams } from '@/types/admin';

interface UserActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

export const UserActivityModal: React.FC<UserActivityModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}) => {
  const [params, setParams] = useState<GetUserActivityParams>({
    page: 1,
    limit: 20,
  });
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-activity', userId, params, actionFilter, dateRange],
    queryFn: () => {
      const queryParams: GetUserActivityParams = {
        ...params,
        action: actionFilter === 'all' ? undefined : actionFilter,
      };

      if (dateRange !== 'all') {
        const days = parseInt(dateRange.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        queryParams.startDate = startDate.toISOString().split('T')[0];
      }

      return adminService.getUserActivity(userId, queryParams);
    },
    enabled: isOpen && !!userId,
  });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return LogIn;
      case 'logout':
        return LogOut;
      case 'create':
      case 'submit':
        return FilePlus;
      case 'view':
      case 'read':
        return Eye;
      case 'update':
      case 'edit':
        return Edit;
      case 'delete':
        return Trash2;
      default:
        return Activity;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Activity
          </DialogTitle>
          <DialogDescription>
            {userName} · {userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger aria-label="Action" className="sm:w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger aria-label="Date range" className="sm:w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last day</SelectItem>
                <SelectItem value="7d">Last week</SelectItem>
                <SelectItem value="30d">Last month</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <LoadingState label="Loading activity…" />
            ) : error ? (
              <ErrorState
                title="Could not load activity"
                message="The admin service did not respond."
                onRetry={refetch}
              />
            ) : !data?.data?.length ? (
              <EmptyState
                icon={Activity}
                title="No activity found for this user"
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.data.map((log: AuditLog) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <li
                      key={log.id}
                      className="flex items-start gap-2.5 py-2.5"
                    >
                      <Icon
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Badge>{log.action}</Badge>
                          {log.resourceType && (
                            <Badge variant="outline">{log.resourceType}</Badge>
                          )}
                        </div>

                        {log.resourceId && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Resource: {log.resourceId}
                          </p>
                        )}

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <time dateTime={log.createdAt}>
                            {formatDate(log.createdAt)}
                          </time>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {data && data.totalPages > 1 && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
