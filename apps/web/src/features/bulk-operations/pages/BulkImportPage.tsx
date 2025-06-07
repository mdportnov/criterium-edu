import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BulkOperationStatus } from '@/types';
import { BulkOperationsService } from '@/services';
import { AlertCircle } from 'lucide-react';
import { UserRole } from '@app/shared';

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
      const interval = setInterval(async () => {
        if (response.operationId) {
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
        }
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(
        err.response?.data?.message ||
          'Failed to upload file. Please try again.',
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
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this page.
          <Button asChild variant="outline" className="mt-4 ml-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bulk Import Tasks</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {operationStatus && operationStatus.status === 'completed' ? (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-check-circle"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 className="text-xl font-semibold">Import Completed</h2>
              </div>

              <div className="space-y-4">
                <p>
                  The bulk import operation has been completed successfully.
                </p>

                <div className="bg-muted p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Total Tasks:</div>
                    <div className="font-medium">
                      {operationStatus.totalItems}
                    </div>

                    <div className="text-muted-foreground">Successful:</div>
                    <div className="font-medium text-green-600">
                      {operationStatus.successCount}
                    </div>

                    <div className="text-muted-foreground">Failed:</div>
                    <div className="font-medium text-destructive">
                      {operationStatus.failedCount}
                    </div>
                  </div>
                </div>

                {operationStatus.errors &&
                  operationStatus.errors.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Errors:</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
                        {operationStatus.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="flex justify-between pt-4">
                  <Button asChild variant="outline">
                    <Link to="/dashboard/tasks">View Tasks</Link>
                  </Button>

                  <Button onClick={resetForm}>Import Another File</Button>
                </div>
              </div>
            </div>
          ) : operationStatus && operationStatus.status === 'failed' ? (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center gap-2 text-destructive mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x-circle"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h2 className="text-xl font-semibold">Import Failed</h2>
              </div>

              <div className="space-y-4">
                <p>The bulk import operation has failed.</p>

                {operationStatus.errors &&
                  operationStatus.errors.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Errors:</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
                        {operationStatus.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <Button onClick={resetForm} className="w-full">
                  Try Again
                </Button>
              </div>
            </div>
          ) : operationStatus && operationStatus.status === 'processing' ? (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center gap-2 text-primary mb-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                <h2 className="text-xl font-semibold">Processing Import</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Your file is being processed. This may take a few moments.
                </p>

                <div className="bg-muted p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Operation ID:</div>
                    <div className="font-mono text-sm">{operationId}</div>

                    <div className="text-muted-foreground">Status:</div>
                    <div className="font-medium capitalize">
                      {operationStatus.status}
                    </div>

                    <div className="text-muted-foreground">Progress:</div>
                    <div className="font-medium">
                      {operationStatus.processedCount} /{' '}
                      {operationStatus.totalItems}
                    </div>
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
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
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-card rounded-lg shadow-sm border border-border p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Upload File</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file">Select CSV or JSON File</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-file"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFile(null)}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mx-auto text-muted-foreground"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className="text-muted-foreground">
                          Drag and drop your file here, or click to browse
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById('file')?.click()
                          }
                        >
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!file || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Import Tasks'}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>

            <div className="space-y-4">
              <p>
                You can import multiple tasks at once by uploading a CSV or JSON
                file. The file should follow the required format for successful
                import.
              </p>

              <div>
                <h3 className="font-medium mb-2">CSV Format:</h3>
                <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
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
                <h3 className="font-medium mb-2">JSON Format:</h3>
                <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
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
                <h3 className="font-medium mb-2">Notes:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    For CSV files, use pipe (|) to separate multiple values
                    within a cell.
                  </li>
                  <li>The maximum file size is 10MB.</li>
                  <li>Each task must have at least one criterion.</li>
                  <li>Categories and tags are optional.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Download Templates</h2>

            <div className="space-y-4">
              <p>
                You can download template files to get started quickly. Fill in
                the template with your task data and upload it.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  CSV Template
                </Button>

                <Button variant="outline" className="flex-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  JSON Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportPage;
