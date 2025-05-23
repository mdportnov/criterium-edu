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
import { BulkOperationsService } from '@/services/bulk-operations.service';
import {
  OperationType,
  type ProcessingOperation,
  ProcessingStatus,
} from '@/types';

const ProcessingOperationPage = () => {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const [operation, setOperation] = useState<ProcessingOperation | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!operationId) return;

    const fetchOperation = async () => {
      try {
        const result =
          await BulkOperationsService.getProcessingOperationStatus(operationId);
        setOperation(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch operation status',
        );
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
    }, 2000);

    return () => clearInterval(interval);
  }, [operationId, operation?.status]);

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.PENDING:
        return 'default';
      case ProcessingStatus.IN_PROGRESS:
        return 'secondary';
      case ProcessingStatus.COMPLETED:
        return 'success';
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

  const handleNextStep = () => {
    if (operation?.type === OperationType.BULK_SOLUTION_IMPORT) {
      // Navigate to LLM processing for the imported solutions
      navigate('/dashboard/reviews/llm-processing', {
        state: { taskId: operation.metadata?.taskIds?.[0] },
      });
    } else if (operation?.type === OperationType.LLM_ASSESSMENT) {
      // Navigate to approval dashboard
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Operation Status</h1>
        <p className="text-muted-foreground mt-2">
          {getOperationTypeLabel(operation.type)} - {operation.id}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Operation Details</CardTitle>
              <Badge variant={getStatusColor(operation.status)}>
                {operation.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>
              Started {new Date(operation.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">
                  {getOperationTypeLabel(operation.type)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Progress</p>
                <p className="text-sm text-muted-foreground">
                  {operation.processedItems} / {operation.totalItems} (
                  {operation.progress}%)
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500'
                    : isFailed
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${operation.progress}%` }}
              />
            </div>

            {operation.errorMessage && (
              <Alert variant="destructive">
                <p className="font-medium">Error</p>
                <p className="text-sm">{operation.errorMessage}</p>
              </Alert>
            )}

            {operation.metadata && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Additional Information
                </p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(operation.metadata, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {isCompleted && (
          <Card>
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
                  <Button onClick={handleNextStep}>
                    Review Generated Feedback
                  </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Operation Failed</CardTitle>
              <CardDescription>
                The operation encountered an error and could not be completed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/dashboard/reviews')}>
                Back to Reviews
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProcessingOperationPage;
