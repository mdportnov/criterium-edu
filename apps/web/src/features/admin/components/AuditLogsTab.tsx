import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import {
  Table,
  TableWrap,
  TBody,
  Td,
  TdMuted,
  Th,
  THead,
  Tr,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Activity, Search, User, X } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AuditLog, GetAuditLogsParams } from '@/types/admin';

export const AuditLogsTab: React.FC = () => {
  const [params, setParams] = useState<GetAuditLogsParams>({
    page: 1,
    limit: 50,
  });
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () => adminService.getAuditLogs(params),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((prev) => ({
        ...prev,
        action: actionFilter || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [actionFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((prev) => ({
        ...prev,
        userId: userFilter || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [userFilter]);

  const hasFilters = Boolean(actionFilter) || Boolean(userFilter);

  const clearFilters = () => {
    setActionFilter('');
    setUserFilter('');
    setParams((prev) => ({
      ...prev,
      action: undefined,
      userId: undefined,
      page: 1,
    }));
  };

  const getStatusVariant = (statusCode?: number) => {
    if (!statusCode) return 'neutral';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400) return 'danger';
    return 'neutral';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return '—';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load audit logs"
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
            placeholder="Filter by action"
            aria-label="Filter by action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="relative flex-1">
          <User
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Filter by user ID"
            aria-label="Filter by user ID"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={
            hasFilters ? 'No logs match these filters' : 'No audit logs yet'
          }
          description={
            hasFilters
              ? 'Try a different action or user ID, or clear the filters.'
              : 'Requests to the platform are recorded here as they happen.'
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
                <Th className="w-40">Timestamp</Th>
                <Th className="min-w-[12rem]">User</Th>
                <Th>Action</Th>
                <Th className="hidden lg:table-cell">Resource</Th>
                <Th className="w-20">Status</Th>
                <Th numeric className="w-20">
                  Duration
                </Th>
                <Th className="hidden xl:table-cell">IP address</Th>
              </tr>
            </THead>
            <TBody>
              {data?.data.map((log: AuditLog) => (
                <Tr key={log.id}>
                  <Td>
                    <time
                      dateTime={log.createdAt}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDate(log.createdAt)}
                    </time>
                  </Td>
                  <Td>
                    {log.user ? (
                      <>
                        <p className="text-foreground">
                          {log.user.firstName && log.user.lastName
                            ? `${log.user.firstName} ${log.user.lastName}`
                            : log.user.email}
                        </p>
                        <TdMuted>{log.user.email}</TdMuted>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Anonymous</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline">{log.method}</Badge>
                      <span className="text-foreground">{log.action}</span>
                    </div>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {log.resourceType && (
                      <p className="text-foreground">{log.resourceType}</p>
                    )}
                    {log.resourceId && <TdMuted>{log.resourceId}</TdMuted>}
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {log.url}
                    </p>
                  </Td>
                  <Td>
                    <Badge variant={getStatusVariant(log.statusCode)}>
                      {log.statusCode ?? 'N/A'}
                    </Badge>
                  </Td>
                  <Td numeric className="text-muted-foreground">
                    {formatDuration(log.durationMs)}
                  </Td>
                  <Td className="hidden xl:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {log.ipAddress || '—'}
                    </span>
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
    </Card>
  );
};
