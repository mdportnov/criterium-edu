import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

/*
 * Footer rail for every paginated list. It stays mounted on a single page so the
 * range readout ("1–12 of 12") and the page-size control do not disappear the moment
 * a filter narrows the list to one page — that jump was disorienting.
 */
export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const getVisiblePages = (): (number | 'gap')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const delta = 1;
    const pages: (number | 'gap')[] = [1];
    const from = Math.max(2, currentPage - delta);
    const to = Math.min(totalPages - 1, currentPage + delta);
    if (from > 2) pages.push('gap');
    for (let i = from; i <= to; i++) pages.push(i);
    if (to < totalPages - 1) pages.push('gap');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {total === 0 ? 'No results' : `${startItem}–${endItem} of ${total}`}
        </p>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger size="sm" className="w-auto gap-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getVisiblePages().map((page, index) =>
            page === 'gap' ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-xs text-muted-foreground"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'secondary' : 'ghost'}
                size="icon-sm"
                className="tabular-nums"
                aria-current={currentPage === page ? 'page' : undefined}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
