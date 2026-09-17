import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { TaskSolution, PaginatedResponse } from '@/types';
import { TaskSolutionStatus } from '@/types';
import { TaskSolutionService } from '@/services';
import { FileText, Search, X } from 'lucide-react';

const ALL = '__all__';

const MySubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [paginatedData, setPaginatedData] =
    useState<PaginatedResponse<TaskSolution> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    TaskSolutionStatus | typeof ALL
  >(ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchSolutions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await TaskSolutionService.getMyTaskSolutions({
        page: currentPage,
        size: pageSize,
      });
      setPaginatedData(data);
    } catch (err) {
      console.error('Error fetching solutions:', err);
      setError('Failed to load your submissions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPage, pageSize]);

  useEffect(() => {
    void fetchSolutions();
  }, [fetchSolutions]);

  // useMemo cannot depend on a fresh [] literal every render, so the fallback
  // has to be a stable reference.
  const solutions = useMemo(() => paginatedData?.data ?? [], [paginatedData]);
  const totalPages = paginatedData?.totalPages || 0;
  const total = paginatedData?.total || 0;

  const filteredSolutions = useMemo(() => {
    let result = solutions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((solution) =>
        (solution.task?.title ?? `Task #${solution.taskId}`)
          .toLowerCase()
          .includes(term),
      );
    }
    if (statusFilter !== ALL) {
      result = result.filter((solution) => solution.status === statusFilter);
    }
    return result;
  }, [solutions, searchTerm, statusFilter]);

  const hasFilters = Boolean(searchTerm) || statusFilter !== ALL;

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter(ALL);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div>
      <PageHeader
        title="My submissions"
        description={total === 1 ? '1 submission' : `${total} submissions`}
      />

      {error ? (
        <ErrorState
          title="Could not load your submissions"
          message={error}
          onRetry={() => void fetchSolutions()}
        />
      ) : (
        <Card>
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Filter by task title"
                aria-label="Filter submissions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as TaskSolutionStatus | typeof ALL)
              }
            >
              <SelectTrigger aria-label="Status" className="sm:w-[11rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value={TaskSolutionStatus.PENDING}>
                  Pending
                </SelectItem>
                <SelectItem value={TaskSolutionStatus.IN_REVIEW}>
                  In review
                </SelectItem>
                <SelectItem value={TaskSolutionStatus.REVIEWED}>
                  Reviewed
                </SelectItem>
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
          ) : filteredSolutions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                hasFilters
                  ? 'No submissions match these filters'
                  : 'No submissions yet'
              }
              description={
                hasFilters
                  ? 'Try a shorter search term, or clear the status filter.'
                  : 'Solutions you submit for tasks will show up here.'
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/tasks">Browse tasks</Link>
                  </Button>
                )
              }
            />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <tr>
                    <Th>Task</Th>
                    <Th className="hidden sm:table-cell">Submitted</Th>
                    <Th>Status</Th>
                    <Th className="w-px text-right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </THead>
                <TBody>
                  {filteredSolutions.map((solution) => (
                    <Tr key={solution.id}>
                      <Td>
                        <Link
                          to={`/dashboard/tasks/${solution.taskId}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {solution.task?.title ?? `Task #${solution.taskId}`}
                        </Link>
                      </Td>
                      <Td className="hidden text-muted-foreground sm:table-cell">
                        {new Date(solution.submittedAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        <StatusBadge status={solution.status} />
                      </Td>
                      <Td className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/dashboard/solutions/${solution.id}`}>
                            View
                          </Link>
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          )}

          {!isLoading && filteredSolutions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default MySubmissionsPage;
