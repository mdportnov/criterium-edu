import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Clock,
  Globe,
  User,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AuditLog, GetAuditLogsParams } from '@/types/admin';

export const AuditLogsTab: React.FC = () => {
  const [params, setParams] = useState<GetAuditLogsParams>({
    page: 1,
    limit: 50,
  });
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () => adminService.getAuditLogs(params),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => ({
        ...prev,
        action: actionFilter || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [actionFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => ({
        ...prev,
        userId: userFilter || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [userFilter]);

  const handlePageChange = (newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadgeVariant = (statusCode?: number) => {
    if (!statusCode) return 'secondary';
    if (statusCode >= 200 && statusCode < 300) return 'default';
    if (statusCode >= 400) return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = (statusCode?: number) => {
    if (!statusCode) return <Activity className="w-3 h-3" />;
    if (statusCode >= 200 && statusCode < 300) return <CheckCircle2 className="w-3 h-3" />;
    if (statusCode >= 400) return <AlertCircle className="w-3 h-3" />;
    return <Activity className="w-3 h-3" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return '-';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600 dark:text-green-400';
    if (action.includes('update')) return 'text-blue-600 dark:text-blue-400';
    if (action.includes('delete')) return 'text-red-600 dark:text-red-400';
    if (action.includes('view') || action.includes('list')) return 'text-gray-600 dark:text-gray-400';
    return 'text-purple-600 dark:text-purple-400';
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load audit logs</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative flex-1">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Filter by user ID..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Audit Logs Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Resource</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((log: AuditLog) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {log.user.firstName && log.user.lastName 
                                ? `${log.user.firstName} ${log.user.lastName}`
                                : log.user.email
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">{log.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Anonymous</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getActionColor(log.action)} border-current`}>
                          {log.method}
                        </Badge>
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {log.resourceType && (
                          <div className="font-medium text-foreground">{log.resourceType}</div>
                        )}
                        {log.resourceId && (
                          <div className="text-xs text-muted-foreground">{log.resourceId}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {log.url}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusBadgeVariant(log.statusCode)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(log.statusCode)}
                        {log.statusCode || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(log.durationMs)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {log.ipAddress || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                Page {data.page} of {data.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page === data.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};