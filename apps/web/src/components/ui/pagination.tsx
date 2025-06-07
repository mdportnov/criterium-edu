import { Button } from './button';
import { Select } from './select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} results
        </p>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size.toString()}>
              {size} per page
            </option>
          ))}
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) =>
            page === '...' ? (
              <span key={index} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={index}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}