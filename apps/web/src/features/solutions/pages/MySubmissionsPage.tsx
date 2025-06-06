import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import type { TaskSolution, PaginatedResponse } from '@/types';
import { TaskSolutionService } from '@/services';

const MySubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<TaskSolution> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchSolutions = async () => {
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
    };

    fetchSolutions();
  }, [user, currentPage, pageSize]);

  const solutions = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 0;
  const total = paginatedData?.total || 0;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Submissions</h1>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Search by task title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>
      </div>

      {solutions.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No submissions found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm || statusFilter
              ? 'Try adjusting your search filters'
              : "You haven't submitted any solutions yet"}
          </p>

          {!searchTerm && !statusFilter && (
            <Button asChild className="mt-4">
              <Link to="/tasks">Browse Tasks</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {solutions.map((solution) => (
            <div
              key={solution.id}
              className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      <Link
                        to={`/dashboard/tasks/${solution.taskId}`}
                        className="hover:text-primary transition-colors"
                      >
                        Task #{solution.taskId}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Submitted on{' '}
                      {new Date(solution.submittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded-full ${
                        solution.status === 'reviewed'
                          ? 'bg-green-100 text-green-800'
                          : solution.status === 'in_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {solution.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md overflow-x-auto mb-4">
                  <pre className="text-xs font-mono line-clamp-3">
                    <code>{solution.solutionText}</code>
                  </pre>
                </div>

                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/dashboard/solutions/${solution.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MySubmissionsPage;
