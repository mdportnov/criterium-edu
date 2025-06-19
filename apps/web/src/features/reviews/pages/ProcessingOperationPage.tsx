import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { BulkOperationsService } from '@/services/bulk-operations.service';
import {
  OperationType,
  type ProcessingOperation,
  ProcessingStatus,
} from '@/types';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
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
      // Refresh the operation status
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
      // Refresh the operation status
      handleManualRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to restart operation',
      );
    } finally {
      setIsRestartingOperation(false);
    }
  };

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.PENDING:
        return 'default';
      case ProcessingStatus.IN_PROGRESS:
        return 'secondary';
      case ProcessingStatus.COMPLETED:
        return 'default';
      case ProcessingStatus.FAILED:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getOperationTypeLabel = (type: OperationType) => {
    switch (type) {
      case OperationType.BULK_SOLUTION_IMPORT:
        return 'Bulk Solution Import';
      case OperationType.LLM_ASSESSMENT:
        return 'LLM Assessment';
      default:
        return type;
    }
  };

  const getOperationIcon = (type: OperationType) => {
    switch (type) {
      case OperationType.BULK_SOLUTION_IMPORT:
        return <FileText className="w-5 h-5" />;
      case OperationType.LLM_ASSESSMENT:
        return <Zap className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.PENDING:
        return <Clock className="w-4 h-4" />;
      case ProcessingStatus.IN_PROGRESS:
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case ProcessingStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      case ProcessingStatus.FAILED:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
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

  const renderMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div className="space-y-3">
        {metadata.taskIds && (
          <div>
            <p className="text-sm font-medium mb-1">Affected Tasks</p>
            <div className="flex flex-wrap gap-1">
              {metadata.taskIds.map((taskId: string) => (
                <Badge key={taskId} variant="outline" className="text-xs">
                  Task #{taskId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {metadata.llmModel && (
          <div>
            <p className="text-sm font-medium mb-1">AI Model</p>
            <Badge variant="secondary" className="text-xs">
              {metadata.llmModel}
            </Badge>
          </div>
        )}

        {metadata.successfullyImported !== undefined && (
          <div>
            <p className="text-sm font-medium mb-1">Import Results</p>
            <div className="flex gap-2">
              <Badge
                variant="default"
                className="text-xs bg-green-100 text-green-800"
              >
                {metadata.successfullyImported} imported
              </Badge>
              {metadata.errors && metadata.errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metadata.errors.length} failed
                </Badge>
              )}
            </div>
          </div>
        )}

        {metadata.successfullyProcessed !== undefined && (
          <div>
            <p className="text-sm font-medium mb-1">Processing Results</p>
            <div className="flex gap-2">
              <Badge
                variant="default"
                className="text-xs bg-green-100 text-green-800"
              >
                {metadata.successfullyProcessed} processed
              </Badge>
              {metadata.errors && metadata.errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metadata.errors.length} failed
                </Badge>
              )}
            </div>
          </div>
        )}

        {metadata.errors && metadata.errors.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Errors</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {metadata.errors.slice(0, 5).map((error: any, index: number) => (
                <div
                  key={index}
                  className="text-xs bg-red-50 text-red-800 p-2 rounded"
                >
                  {typeof error === 'string'
                    ? error
                    : error.error || JSON.stringify(error)}
                </div>
              ))}
              {metadata.errors.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  ... and {metadata.errors.length - 5} more errors
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

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">{error}</Alert>
        <Button onClick={() => navigate('/dashboard/reviews')} className="mt-4">
          Back to Reviews
        </Button>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <p>Loading operation status...</p>
        </div>
      </div>
    );
  }

  const isCompleted = operation.status === ProcessingStatus.COMPLETED;
  const isFailed = operation.status === ProcessingStatus.FAILED;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/reviews')}
            className="mt-1 hover:cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {getOperationIcon(operation.type)}
              Operation Status
            </h1>
            <p className="text-muted-foreground mt-2">
              {getOperationTypeLabel(operation.type)} - {operation.id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Stop Button - Show only for running operations */}
          {(operation.status === ProcessingStatus.PENDING ||
            operation.status === ProcessingStatus.IN_PROGRESS) && (
            <Button
              variant="destructive"
              onClick={handleStopOperation}
              disabled={isStoppingOperation}
              className="gap-2"
            >
              <Square
                className={`w-4 h-4 ${isStoppingOperation ? 'animate-pulse' : ''}`}
              />
              {isStoppingOperation ? 'Stopping...' : 'Stop'}
            </Button>
          )}

          {/* Restart Button - Show for failed or completed LLM assessment operations */}
          {(operation.status === ProcessingStatus.FAILED ||
            (operation.status === ProcessingStatus.COMPLETED &&
              operation.type === OperationType.LLM_ASSESSMENT)) && (
            <Button
              variant="outline"
              onClick={handleRestartOperation}
              disabled={isRestartingOperation}
              className="gap-2"
            >
              <RotateCcw
                className={`w-4 h-4 ${isRestartingOperation ? 'animate-spin' : ''}`}
              />
              {isRestartingOperation ? 'Restarting...' : 'Restart'}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(operation.status)}
                  Operation Details
                </CardTitle>
                <Badge
                  variant={getStatusColor(operation.status)}
                  className="gap-1"
                >
                  {getStatusIcon(operation.status)}
                  {operation.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                Started {new Date(operation.createdAt).toLocaleString()}
                {operation.updatedAt &&
                  operation.updatedAt !== operation.createdAt && (
                    <span>
                      {' '}
                      • Updated {new Date(operation.updatedAt).toLocaleString()}
                    </span>
                  )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {getOperationIcon(operation.type)}
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-xs text-muted-foreground">
                      {getOperationTypeLabel(operation.type)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Activity className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-xs text-muted-foreground">
                      {operation.processedItems} / {operation.totalItems}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-xs text-muted-foreground">
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

              {/* Enhanced Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{operation.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ease-out relative ${
                      isCompleted
                        ? 'bg-green-500'
                        : isFailed
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${operation.progress}%` }}
                  >
                    {operation.status === ProcessingStatus.IN_PROGRESS && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{operation.totalItems} items</span>
                </div>
              </div>

              {operation.errorMessage && (
                <Alert
                  variant="destructive"
                  className="border-l-4 border-l-red-500"
                >
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Operation Failed</p>
                    <p className="text-sm mt-1">{operation.errorMessage}</p>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          {operation.metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Operation Details</CardTitle>
                <CardDescription>
                  Additional information about this operation
                </CardDescription>
              </CardHeader>
              <CardContent>{renderMetadata(operation.metadata)}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={getStatusColor(operation.status)}
                  className="text-xs"
                >
                  {operation.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processed</span>
                <span className="text-sm font-medium">
                  {operation.processedItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="text-sm font-medium">
                  {operation.totalItems - operation.processedItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Items
                </span>
                <span className="text-sm font-medium">
                  {operation.totalItems}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Started</span>
                <span className="text-xs">
                  {new Date(operation.createdAt).toLocaleTimeString()}
                </span>
              </div>
              {operation.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Update
                  </span>
                  <span className="text-xs">
                    {new Date(operation.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isCompleted && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Operation Completed</CardTitle>
            <CardDescription>What would you like to do next?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {operation.type === OperationType.BULK_SOLUTION_IMPORT && (
                <Button onClick={handleNextStep}>Start LLM Assessment</Button>
              )}
              {operation.type === OperationType.LLM_ASSESSMENT && (
                <>
                  <Button onClick={handleNextStep}>
                    Review Generated Feedback
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRestartOperation}
                    disabled={isRestartingOperation}
                    className="gap-2"
                  >
                    <RotateCcw
                      className={`w-4 h-4 ${isRestartingOperation ? 'animate-spin' : ''}`}
                    />
                    {isRestartingOperation ? 'Restarting...' : 'Run Again'}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/reviews')}
              >
                Back to Reviews
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isFailed && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Operation Failed</CardTitle>
            <CardDescription>
              The operation encountered an error and could not be completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleRestartOperation}
                disabled={isRestartingOperation}
                className="gap-2"
              >
                <RotateCcw
                  className={`w-4 h-4 ${isRestartingOperation ? 'animate-spin' : ''}`}
                />
                {isRestartingOperation ? 'Restarting...' : 'Restart Operation'}
              </Button>
              <Button onClick={() => navigate('/dashboard/reviews')}>
                Back to Reviews
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProcessingOperationPage;
