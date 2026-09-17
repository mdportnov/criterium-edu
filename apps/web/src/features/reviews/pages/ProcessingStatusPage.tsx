import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { BulkOperationsService } from '@/services/bulk-operations.service';
import type {
  PaginatedResponse,
  ProcessingOperation,
  OperationType,
} from '@/types';
import { Activity, FileText, RefreshCw, Trash2, Zap } from 'lucide-react';

const ProcessingStatusPage = () => {
  const [paginatedData, setPaginatedData] =
    useState<PaginatedResponse<ProcessingOperation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const operations = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 0;
  const total = paginatedData?.total || 0;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchOperations = async () => {
      try {
        const data = await BulkOperationsService.getAllProcessingOperations({
          page: currentPage,
          size: pageSize,
        });
        setPaginatedData(data);
        setError('');
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch operations',
        );
        setLoading(false);
      }
    };

    fetchOperations();

    // Set up polling for updates
    const interval = setInterval(fetchOperations, 10000);
    return () => clearInterval(interval);
  }, [currentPage, pageSize]);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await BulkOperationsService.getAllProcessingOperations({
        page: currentPage,
        size: pageSize,
      });
      setPaginatedData(data);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh operations',
      );
      setLoading(false);
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    if (!confirm('Are you sure you want to delete this operation?')) {
      return;
    }

    setDeletingId(operationId);
    try {
      await BulkOperationsService.deleteOperation(operationId);
      const data = await BulkOperationsService.getAllProcessingOperations({
        page: currentPage,
        size: pageSize,
      });
      setPaginatedData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete operation',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getOperationIcon = (type: OperationType) => {
    switch (type) {
      case 'bulk_solution_import':
        return (
          <FileText
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        );
      case 'llm_assessment':
        return (
          <Zap className="size-4 text-muted-foreground" aria-hidden="true" />
        );
      default:
        return (
          <Activity
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        );
    }
  };

  const getOperationLabel = (type: OperationType) => {
    switch (type) {
      case 'bulk_solution_import':
        return 'Bulk solution import';
      case 'llm_assessment':
        return 'LLM assessment';
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  return (
    <div>
      <PageHeader
        title="Processing status"
        description="Active operations and background processes."
        actions={
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
        }
      />

      <div className="space-y-4">
        {error ? (
          <ErrorState
            title="Could not load operations"
            message={error}
            onRetry={handleRefresh}
          />
        ) : loading ? (
          <Card>
            <LoadingState />
          </Card>
        ) : operations.length === 0 ? (
          <Card>
            <EmptyState
              icon={Activity}
              title="No active operations"
              description="All background processes have completed."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {operations.map((operation) => (
              <Card key={operation.id}>
                <CardHeader>
                  <CardHeaderText>
                    <CardTitle className="flex items-center gap-2">
                      {getOperationIcon(operation.type)}
                      {getOperationLabel(operation.type)}
                    </CardTitle>
                  </CardHeaderText>
                  <CardAction>
                    <StatusBadge status={operation.status} />
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="tabular-nums">
                        {operation.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${operation.progress}%` }}
                      />
                    </div>
                  </div>

                  {operation.errorMessage && (
                    <p className="rounded-md border border-danger/25 bg-danger-soft p-2 text-[13px] leading-5 text-danger">
                      {operation.errorMessage}
                    </p>
                  )}

                  {operation.metadata && (
                    <div className="space-y-1 text-[13px] text-muted-foreground">
                      {operation.metadata.taskIds && (
                        <p>
                          Tasks:{' '}
                          {Array.isArray(operation.metadata.taskIds)
                            ? operation.metadata.taskIds.join(', ')
                            : operation.metadata.taskIds}
                        </p>
                      )}
                      {operation.metadata.llmModel && (
                        <p>Model: {operation.metadata.llmModel}</p>
                      )}
                      {operation.metadata.successfullyImported !==
                        undefined && (
                        <p>
                          Imported:{' '}
                          <span className="tabular-nums">
                            {operation.metadata.successfullyImported}
                          </span>
                        </p>
                      )}
                      {operation.metadata.successfullyProcessed !==
                        undefined && (
                        <p>
                          Processed:{' '}
                          <span className="tabular-nums">
                            {operation.metadata.successfullyProcessed}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Started {formatDate(operation.createdAt.toString())}
                    </span>
                    {operation.updatedAt &&
                      operation.status === 'completed' && (
                        <span>
                          Completed {formatDate(operation.updatedAt.toString())}
                        </span>
                      )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {(operation.status === 'completed' ||
                        operation.status === 'failed') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOperation(operation.id)}
                          disabled={deletingId === operation.id}
                        >
                          <Trash2 className="size-4" />
                          {deletingId === operation.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      )}
                    </div>
                    {(operation.status === 'in_progress' ||
                      operation.status === 'completed') && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to={`/dashboard/reviews/processing/${operation.id}`}
                        >
                          View details
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && operations.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Quick actions</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Button variant="outline" asChild>
                <Link to="/dashboard/reviews/bulk-upload">
                  Start bulk upload
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard/reviews/llm-processing">
                  LLM assessment
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard/bulk-import">Import tasks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessingStatusPage;
