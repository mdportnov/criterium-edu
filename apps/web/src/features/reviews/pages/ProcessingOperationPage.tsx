import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/states';
import { Separator } from '@/components/ui/separator';
import { BulkOperationsService } from '@/services/bulk-operations.service';
import {
  OperationType,
  type ProcessingOperation,
  ProcessingStatus,
} from '@/types';
import {
  Activity,
  Clock,
  FileText,
  RefreshCw,
  RotateCcw,
  Square,
  Zap,
} from 'lucide-react';

const ProcessingOperationPage = () => {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const [operation, setOperation] = useState<ProcessingOperation | null>(null);
  const [error, setError] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStoppingOperation, setIsStoppingOperation] = useState(false);
  const [isRestartingOperation, setIsRestartingOperation] = useState(false);

  useEffect(() => {
    if (!operationId) return undefined;

    const fetchOperation = async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setIsRefreshing(true);
        const result =
          await BulkOperationsService.getProcessingOperationStatus(operationId);
        setOperation(result);
        setError('');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch operation status',
        );
      } finally {
        if (isManualRefresh) setIsRefreshing(false);
      }
    };

    fetchOperation();

    // Poll for updates if operation is still running
    const interval = setInterval(() => {
      if (
        operation?.status === ProcessingStatus.IN_PROGRESS ||
        operation?.status === ProcessingStatus.PENDING
      ) {
        fetchOperation();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [operationId, operation?.status]);

  const handleManualRefresh = () => {
    if (!operationId) return;
    const fetchOperation = async () => {
      try {
        setIsRefreshing(true);
        const result =
          await BulkOperationsService.getProcessingOperationStatus(operationId);
        setOperation(result);
        setError('');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch operation status',
        );
      } finally {
        setIsRefreshing(false);
      }
    };
    fetchOperation();
  };

  const handleStopOperation = async () => {
    if (!operationId) return;

    try {
      setIsStoppingOperation(true);
      await BulkOperationsService.stopOperation(operationId);
      handleManualRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop operation');
    } finally {
      setIsStoppingOperation(false);
    }
  };

  const handleRestartOperation = async () => {
    if (!operationId) return;

    try {
      setIsRestartingOperation(true);
      await BulkOperationsService.restartOperation(operationId);
      handleManualRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to restart operation',
      );
    } finally {
      setIsRestartingOperation(false);
    }
  };

  const getOperationTypeLabel = (type: OperationType) => {
    switch (type) {
      case OperationType.BULK_SOLUTION_IMPORT:
        return 'Bulk solution import';
      case OperationType.LLM_ASSESSMENT:
        return 'LLM assessment';
      default:
        return type;
    }
  };

  const getOperationIcon = (type: OperationType) => {
    switch (type) {
      case OperationType.BULK_SOLUTION_IMPORT:
        return (
          <FileText
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        );
      case OperationType.LLM_ASSESSMENT:
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

  const formatDuration = (startDate: Date, endDate?: Date) => {
    const end = endDate || new Date();
    const diff = end.getTime() - startDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const renderMetadata = (metadata: Record<string, unknown>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    // The operation metadata is an untyped JSON blob from the API, so narrow the
    // few keys this panel reads rather than asserting the whole shape.
    const errorList: unknown[] = Array.isArray(metadata.errors)
      ? metadata.errors
      : [];
    const taskIds: string[] = Array.isArray(metadata.taskIds)
      ? metadata.taskIds.map(String)
      : [];
    const text = (value: unknown) => (value == null ? null : String(value));

    return (
      <div className="space-y-3">
        {taskIds.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-foreground">
              Affected tasks
            </p>
            <div className="flex flex-wrap gap-1">
              {taskIds.map((taskId) => (
                <Badge key={taskId} variant="outline">
                  Task #{taskId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {metadata.llmModel && (
          <div>
            <p className="mb-1 text-xs font-medium text-foreground">AI model</p>
            <Badge>{text(metadata.llmModel)}</Badge>
          </div>
        )}

        {metadata.successfullyImported !== undefined && (
          <div>
            <p className="mb-1 text-xs font-medium text-foreground">
              Import results
            </p>
            <div className="flex gap-2">
              <Badge variant="success">
                {text(metadata.successfullyImported)} imported
              </Badge>
              {errorList.length > 0 && (
                <Badge variant="danger">{errorList.length} failed</Badge>
              )}
            </div>
          </div>
        )}

        {metadata.successfullyProcessed !== undefined && (
          <div>
            <p className="mb-1 text-xs font-medium text-foreground">
              Processing results
            </p>
            <div className="flex gap-2">
              <Badge variant="success">
                {text(metadata.successfullyProcessed)} processed
              </Badge>
              {errorList.length > 0 && (
                <Badge variant="danger">{errorList.length} failed</Badge>
              )}
            </div>
          </div>
        )}

        {errorList.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-foreground">Errors</p>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {errorList.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="rounded-md border border-danger/25 bg-danger-soft p-2 text-xs text-danger"
                >
                  {typeof error === 'string'
                    ? error
                    : ((error as { error?: string })?.error ??
                      JSON.stringify(error))}
                </div>
              ))}
              {errorList.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  … and {errorList.length - 5} more errors
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleNextStep = () => {
    if (operation?.type === OperationType.BULK_SOLUTION_IMPORT) {
      navigate('/dashboard/reviews/llm-processing', {
        state: { taskId: operation.metadata?.taskIds?.[0] },
      });
    } else if (operation?.type === OperationType.LLM_ASSESSMENT) {
      navigate('/dashboard/reviews/approval-dashboard');
    }
  };

  if (error && !operation) {
    return (
      <div>
        <PageHeader title="Operation status" backTo="/dashboard/reviews" />
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!operation) {
    return (
      <div>
        <PageHeader title="Operation status" backTo="/dashboard/reviews" />
        <LoadingState label="Loading operation status…" />
      </div>
    );
  }

  const isCompleted = operation.status === ProcessingStatus.COMPLETED;
  const isFailed = operation.status === ProcessingStatus.FAILED;
  const isRunning =
    operation.status === ProcessingStatus.PENDING ||
    operation.status === ProcessingStatus.IN_PROGRESS;

  return (
    <div>
      <PageHeader
        title="Operation status"
        description={`${getOperationTypeLabel(operation.type)} · ${operation.id}`}
        backTo="/dashboard/reviews"
        actions={
          <>
            {isRunning && (
              <Button
                variant="destructive"
                onClick={handleStopOperation}
                disabled={isStoppingOperation}
              >
                <Square className="size-4" />
                {isStoppingOperation ? 'Stopping…' : 'Stop'}
              </Button>
            )}

            {(isFailed ||
              (isCompleted &&
                operation.type === OperationType.LLM_ASSESSMENT)) && (
              <Button
                variant="outline"
                onClick={handleRestartOperation}
                disabled={isRestartingOperation}
              >
                <RotateCcw
                  className={
                    isRestartingOperation ? 'size-4 animate-spin' : 'size-4'
                  }
                />
                {isRestartingOperation ? 'Restarting…' : 'Restart'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={isRefreshing ? 'size-4 animate-spin' : 'size-4'}
              />
              Refresh
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Operation details</CardTitle>
                </CardHeaderText>
                <CardAction>
                  <StatusBadge status={operation.status} />
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Started {new Date(operation.createdAt).toLocaleString()}
                  {operation.updatedAt &&
                    operation.updatedAt !== operation.createdAt && (
                      <>
                        {' '}
                        · Updated{' '}
                        {new Date(operation.updatedAt).toLocaleString()}
                      </>
                    )}
                </p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2.5 rounded-md border border-border p-3">
                    {getOperationIcon(operation.type)}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        Type
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getOperationTypeLabel(operation.type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-md border border-border p-3">
                    <Activity
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        Progress
                      </p>
                      <p className="tabular-nums text-xs text-muted-foreground">
                        {operation.processedItems} / {operation.totalItems}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-md border border-border p-3">
                    <Clock
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        Duration
                      </p>
                      <p className="tabular-nums text-xs text-muted-foreground">
                        {formatDuration(
                          new Date(operation.createdAt),
                          operation.updatedAt
                            ? new Date(operation.updatedAt)
                            : undefined,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {operation.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${operation.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                    <span>0</span>
                    <span>{operation.totalItems} items</span>
                  </div>
                </div>

                {operation.errorMessage && (
                  <Alert variant="destructive">
                    <AlertTitle>Operation failed</AlertTitle>
                    <AlertDescription>
                      {operation.errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {operation.metadata && (
              <Card>
                <CardHeader>
                  <CardHeaderText>
                    <CardTitle>Additional information</CardTitle>
                  </CardHeaderText>
                </CardHeader>
                <CardContent>{renderMetadata(operation.metadata)}</CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Quick stats</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={operation.status} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Processed
                  </span>
                  <span className="text-[13px] font-medium tabular-nums text-foreground">
                    {operation.processedItems}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Remaining
                  </span>
                  <span className="text-[13px] font-medium tabular-nums text-foreground">
                    {operation.totalItems - operation.processedItems}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Total items
                  </span>
                  <span className="text-[13px] font-medium tabular-nums text-foreground">
                    {operation.totalItems}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Started</span>
                  <span className="text-xs tabular-nums text-foreground">
                    {new Date(operation.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {operation.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last update
                    </span>
                    <span className="text-xs tabular-nums text-foreground">
                      {new Date(operation.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {isCompleted && (
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Operation completed</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {operation.type === OperationType.BULK_SOLUTION_IMPORT && (
                  <Button onClick={handleNextStep}>Start LLM assessment</Button>
                )}
                {operation.type === OperationType.LLM_ASSESSMENT && (
                  <>
                    <Button onClick={handleNextStep}>
                      Review generated feedback
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRestartOperation}
                      disabled={isRestartingOperation}
                    >
                      <RotateCcw
                        className={
                          isRestartingOperation
                            ? 'size-4 animate-spin'
                            : 'size-4'
                        }
                      />
                      {isRestartingOperation ? 'Restarting…' : 'Run again'}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/reviews')}
                >
                  Back to reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isFailed && (
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Operation failed</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleRestartOperation}
                  disabled={isRestartingOperation}
                >
                  <RotateCcw
                    className={
                      isRestartingOperation ? 'size-4 animate-spin' : 'size-4'
                    }
                  />
                  {isRestartingOperation ? 'Restarting…' : 'Restart operation'}
                </Button>
                <Button onClick={() => navigate('/dashboard/reviews')}>
                  Back to reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProcessingOperationPage;
