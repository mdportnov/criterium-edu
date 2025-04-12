import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data available',
  isLoading = false,
  keyExtractor,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const renderCell = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 bg-base-200 rounded-lg">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={column.className}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-base-200' : ''}
            >
              {columns.map((column, index) => (
                <td key={index} className={column.className}>
                  {renderCell(item, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
