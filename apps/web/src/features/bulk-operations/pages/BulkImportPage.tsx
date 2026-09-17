import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { type BulkOperationStatus } from '@/types';
import { BulkOperationsService } from '@/services';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  File,
  Upload,
  XCircle,
} from 'lucide-react';
import { UserRole } from '@app/shared/interfaces';
import { getErrorMessage } from '@/lib/errors';

const BulkImportPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [operationId, setOperationId] = useState<string | null>(null);
  const [operationStatus, setOperationStatus] =
    useState<BulkOperationStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const isAdminOrReviewer = hasRole([UserRole.ADMIN, UserRole.REVIEWER]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Call the bulk import API
      const response = await BulkOperationsService.importTasks(formData);
      setOperationId(response.operationId);

      // Start polling for operation status
      const interval = setInterval(() => {
        if (response.operationId) {
          void (async () => {
            try {
              const status = await BulkOperationsService.getOperationStatus(
                response.operationId,
              );
              setOperationStatus(status);

              // If operation is completed or failed, stop polling
              if (status.status === 'completed' || status.status === 'failed') {
                if (pollingInterval) {
                  clearInterval(pollingInterval);
                  setPollingInterval(null);
                }
              }
            } catch (err) {
              console.error('Error checking operation status:', err);
            }
          })();
        }
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(
        getErrorMessage(err, 'Failed to upload file. Please try again.'),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setOperationId(null);
    setOperationStatus(null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  if (!isAdminOrReviewer) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          You don&apos;t have permission to access this page.
          <div className="mt-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Bulk import tasks"
        description="Import multiple tasks at once from a CSV or JSON file."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          {operationStatus && operationStatus.status === 'completed' ? (
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Import completed</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="success">
                  <CheckCircle2 />
                  <AlertDescription>
                    The bulk import operation has been completed successfully.
                  </AlertDescription>
                </Alert>

                <dl className="grid grid-cols-2 gap-y-2 rounded-md border border-border p-3 text-[13px]">
                  <dt className="text-muted-foreground">Total tasks</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">
                    {operationStatus.totalItems}
                  </dd>

                  <dt className="text-muted-foreground">Successful</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">
                    {operationStatus.successCount}
                  </dd>

                  <dt className="text-muted-foreground">Failed</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">
                    {operationStatus.failedCount}
                  </dd>
                </dl>

                {operationStatus.errors &&
                  operationStatus.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle />
                      <AlertDescription>
                        <ul className="list-disc space-y-1 pl-4">
                          {operationStatus.errors.map((err, index) => (
                            <li key={index}>{err}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button asChild variant="outline">
                  <Link to="/dashboard/tasks">View tasks</Link>
                </Button>
                <Button onClick={resetForm}>Import another file</Button>
              </CardFooter>
            </Card>
          ) : operationStatus && operationStatus.status === 'failed' ? (
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Import failed</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <XCircle />
                  <AlertDescription>
                    The bulk import operation has failed.
                  </AlertDescription>
                </Alert>

                {operationStatus.errors &&
                  operationStatus.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle />
                      <AlertDescription>
                        <ul className="list-disc space-y-1 pl-4">
                          {operationStatus.errors.map((err, index) => (
                            <li key={index}>{err}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
              <CardFooter>
                <Button onClick={resetForm} className="w-full">
                  Try again
                </Button>
              </CardFooter>
            </Card>
          ) : operationStatus && operationStatus.status === 'processing' ? (
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Processing import</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[13px] text-muted-foreground">
                  Your file is being processed. This may take a few moments.
                </p>

                <dl className="grid grid-cols-2 gap-y-2 rounded-md border border-border p-3 text-[13px]">
                  <dt className="text-muted-foreground">Operation ID</dt>
                  <dd className="text-right font-mono text-xs text-foreground">
                    {operationId}
                  </dd>

                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="text-right font-medium capitalize text-foreground">
                    {operationStatus.status}
                  </dd>

                  <dt className="text-muted-foreground">Progress</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">
                    {operationStatus.processedCount} /{' '}
                    {operationStatus.totalItems}
                  </dd>
                </dl>

                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${
                        operationStatus.totalItems > 0
                          ? (operationStatus.processedCount /
                              operationStatus.totalItems) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
            >
              <Card>
                <CardHeader>
                  <CardHeaderText>
                    <CardTitle>Upload file</CardTitle>
                  </CardHeaderText>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Select CSV or JSON file</Label>
                    <div className="rounded-md border border-dashed border-border p-6 text-center">
                      <input
                        id="file"
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {file ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <File className="size-4 text-muted-foreground" />
                            <span className="text-[13px] font-medium text-foreground">
                              {file.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFile(null)}
                          >
                            Change file
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto size-5 text-muted-foreground" />
                          <p className="text-[13px] text-muted-foreground">
                            Drag and drop your file here, or click to browse
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById('file')?.click()
                            }
                          >
                            Select file
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!file || isUploading}
                  >
                    {isUploading ? 'Uploading…' : 'Import tasks'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Instructions</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[13px] text-muted-foreground">
                You can import multiple tasks at once by uploading a CSV or JSON
                file. The file should follow the required format for successful
                import.
              </p>

              <div>
                <h3 className="mb-2 text-[13px] font-medium text-foreground">
                  CSV format
                </h3>
                <pre className="code-block overflow-x-auto text-xs">
                  <code>
                    title,description,categories,tags,criteria_name,criteria_description,criteria_points
                    Task 1,Description
                    1,Category1|Category2,Tag1|Tag2,Criterion1|Criterion2,Description1|Description2,10|5
                    Task 2,Description
                    2,Category3,Tag3|Tag4,Criterion3,Description3,15
                  </code>
                </pre>
              </div>

              <div>
                <h3 className="mb-2 text-[13px] font-medium text-foreground">
                  JSON format
                </h3>
                <pre className="code-block overflow-x-auto text-xs">
                  <code>{`[
  {
    "title": "Task 1",
    "description": "Description 1",
    "categories": ["Category1", "Category2"],
    "tags": ["Tag1", "Tag2"],
    "criteria": [
      {
        "name": "Criterion1",
        "description": "Description1",
        "maxPoints": 10
      },
      {
        "name": "Criterion2",
        "description": "Description2",
        "maxPoints": 5
      }
    ]
  },
  {
    "title": "Task 2",
    "description": "Description 2",
    "categories": ["Category3"],
    "tags": ["Tag3", "Tag4"],
    "criteria": [
      {
        "name": "Criterion3",
        "description": "Description3",
        "maxPoints": 15
      }
    ]
  }
]`}</code>
                </pre>
              </div>

              <div>
                <h3 className="mb-2 text-[13px] font-medium text-foreground">
                  Notes
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  <li>
                    For CSV files, use pipe (|) to separate multiple values
                    within a cell.
                  </li>
                  <li>The maximum file size is 10MB.</li>
                  <li>Each task must have at least one criterion.</li>
                  <li>Categories and tags are optional.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Download templates</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[13px] text-muted-foreground">
                You can download template files to get started quickly. Fill in
                the template with your task data and upload it.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1">
                  <Download />
                  CSV template
                </Button>

                <Button variant="outline" className="flex-1">
                  <Download />
                  JSON template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkImportPage;
