import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BulkOperationsService } from '@/services/bulk-operations.service';
import type { ProcessingOperation, ProcessingStatus, OperationType } from '@/types';
import { Activity, Clock, CheckCircle, AlertCircle, RefreshCw, FileText, Zap, Trash2 } from 'lucide-react';

const ProcessingStatusPage = () => {
  const [operations, setOperations] = useState<ProcessingOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOperations = async () => {
      try {
        const operations = await BulkOperationsService.getAllProcessingOperations();
        setOperations(operations);
        setError('');
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch operations');
        setLoading(false);
      }
    };

    fetchOperations();
    
    // Set up polling for updates
    const interval = setInterval(fetchOperations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const operations = await BulkOperationsService.getAllProcessingOperations();
      setOperations(operations);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh operations');
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
      setOperations(operations.filter(op => op.id !== operationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete operation');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getOperationIcon = (type: OperationType) => {
    switch (type) {
      case 'bulk_solution_import':
        return <FileText className="w-4 h-4" />;
      case 'llm_assessment':
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getOperationLabel = (type: OperationType) => {
    switch (type) {
      case 'bulk_solution_import':
        return 'Bulk Solution Import';
      case 'llm_assessment':
        return 'LLM Assessment';
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Processing Status
          </h1>
          <p className="text-muted-foreground">
            Monitor active operations and background processes
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Operations</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && operations.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active operations</h3>
            <p className="text-muted-foreground text-center">
              All background processes have completed
            </p>
          </CardContent>
        </Card>
      )}

      {!error && operations.length > 0 && (
        <div className="space-y-4">
          {operations.map((operation) => (
            <Card key={operation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getOperationIcon(operation.type)}
                    {getOperationLabel(operation.type)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(operation.status)}
                    {getStatusBadge(operation.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{operation.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${operation.progress}%` }}
                    />
                  </div>
                </div>

                {operation.errorMessage && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {operation.errorMessage}
                  </p>
                )}

                {operation.metadata && (
                  <div className="text-sm space-y-1">
                    {operation.metadata.taskIds && (
                      <p className="text-muted-foreground">
                        Tasks: {Array.isArray(operation.metadata.taskIds) 
                          ? operation.metadata.taskIds.join(', ') 
                          : operation.metadata.taskIds}
                      </p>
                    )}
                    {operation.metadata.llmModel && (
                      <p className="text-muted-foreground">
                        Model: {operation.metadata.llmModel}
                      </p>
                    )}
                    {operation.metadata.successfullyImported !== undefined && (
                      <p className="text-muted-foreground">
                        Imported: {operation.metadata.successfullyImported}
                      </p>
                    )}
                    {operation.metadata.successfullyProcessed !== undefined && (
                      <p className="text-muted-foreground">
                        Processed: {operation.metadata.successfullyProcessed}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Started: {formatDate(operation.createdAt.toString())}</span>
                  {operation.updatedAt && operation.status === 'completed' && (
                    <span>Completed: {formatDate(operation.updatedAt.toString())}</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {(operation.status === 'completed' || operation.status === 'failed') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteOperation(operation.id)}
                        disabled={deletingId === operation.id}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === operation.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                  {(operation.status === 'in_progress' || operation.status === 'completed') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link to={`/dashboard/reviews/processing/${operation.id}`}>
                        View Details
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild>
              <Link to="/dashboard/reviews/bulk-upload">
                Start Bulk Upload
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/reviews/llm-processing">
                LLM Assessment
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/bulk-import">
                Import Tasks
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingStatusPage;