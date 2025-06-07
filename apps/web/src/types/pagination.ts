export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
