import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, DataTable } from '@/components/common';
import { taskSolutionReviewsService } from '@/api';
import { ReviewSource } from '@/types';

const ReviewsPage = () => {
  const [sourceFilter, setSourceFilter] = useState<ReviewSource | 'all'>('all');
  
  // Fetch all reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => taskSolutionReviewsService.getAll(),
  });
  
  // Filter reviews by source if filter is active
  const filteredReviews = reviews?.filter(
    review => sourceFilter === 'all' || review.source === sourceFilter
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Reviews</h1>
      </div>
      
      <Card>
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Filter by Source</span>
            </label>
            <select
              className="select select-bordered"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as ReviewSource | 'all')}
            >
              <option value="all">All Sources</option>
              <option value={ReviewSource.AUTO}>Automated</option>
              <option value={ReviewSource.MANUAL}>Manual</option>
              <option value={ReviewSource.AUTO_APPROVED}>Auto-Approved</option>
              <option value={ReviewSource.AUTO_MODIFIED}>Auto-Modified</option>
            </select>
          </div>
        </div>
        
        <DataTable
          columns={[
            { 
              header: 'Task Solution', 
              accessor: (row) => `Solution #${row.taskSolutionId}`,
            },
            { 
              header: 'Mentor', 
              accessor: (row) => row.mentorId ? `Mentor #${row.mentorId}` : 'Automated',
            },
            { 
              header: 'Score', 
              accessor: (row) => row.totalScore,
            },
            { 
              header: 'Source', 
              accessor: (row) => (
                <div className={`badge ${
                  row.source === ReviewSource.MANUAL 
                    ? 'badge-primary' 
                    : row.source === ReviewSource.AUTO 
                      ? 'badge-secondary' 
                      : 'badge-accent'
                }`}>
                  {row.source}
                </div>
              ),
            },
            { 
              header: 'Created At', 
              accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
            },
            { 
              header: 'Actions', 
              accessor: (row) => (
                <div className="flex gap-2">
                  <Link 
                    to={`/reviews/${row.id}`} 
                    className="btn btn-sm btn-primary"
                  >
                    View
                  </Link>
                  <Link 
                    to={`/reviews/${row.id}/edit`} 
                    className="btn btn-sm btn-secondary"
                  >
                    Edit
                  </Link>
                </div>
              ),
              className: 'w-40',
            },
          ]}
          data={filteredReviews || []}
          isLoading={isLoading}
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No reviews found with the selected filters."
        />
      </Card>
    </div>
  );
};

export default ReviewsPage;
