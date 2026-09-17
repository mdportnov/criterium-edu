import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '@/components/ui/states';
import {
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui/table';
import { type PaginationParams, type Task } from '@/types';
import { TaskService } from '@/services';
import { ListTodo, Plus, Search, Upload, X } from 'lucide-react';
import { UserRole } from '@app/shared';

const ALL = '__all__';

/*
 * The library used to be a three-column card grid: twelve tasks filled four screens
 * and every card repeated the same truncated description. A task is a row of
 * attributes, so it is now a table — title, categories, tags, criteria count, actions.
 * Twelve tasks now fit in one screen, which is the point of a library.
 */
const TasksPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);
  const [selectedTag, setSelectedTag] = useState<string>(ALL);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 20,
  });
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    totalPages: 0,
  });

  const isAdminOrReviewer = hasRole([UserRole.ADMIN, UserRole.REVIEWER]);
  const isStudent = hasRole(UserRole.STUDENT);

  const categories = useMemo(
    () => [...new Set(tasks.flatMap((task) => task.categories || []))].sort(),
    [tasks],
  );
  const tags = useMemo(
    () => [...new Set(tasks.flatMap((task) => task.tags || []))].sort(),
    [tasks],
  );

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await TaskService.getTasks(pagination);
      setTasks(response.data);
      setPaginationMeta({
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('The task service did not respond.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term),
      );
    }
    if (selectedCategory !== ALL) {
      result = result.filter((task) =>
        task.categories?.includes(selectedCategory),
      );
    }
    if (selectedTag !== ALL) {
      result = result.filter((task) => task.tags?.includes(selectedTag));
    }
    return result;
  }, [tasks, searchTerm, selectedCategory, selectedTag]);

  const hasFilters =
    Boolean(searchTerm) || selectedCategory !== ALL || selectedTag !== ALL;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(ALL);
    setSelectedTag(ALL);
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={
          paginationMeta.total === 1
            ? '1 task in the library'
            : `${paginationMeta.total} tasks in the library`
        }
        actions={
          isAdminOrReviewer && (
            <>
              <Button asChild variant="outline">
                <Link to="/dashboard/bulk-import">
                  <Upload className="size-4" />
                  Import
                </Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard/tasks/create">
                  <Plus className="size-4" />
                  New task
                </Link>
              </Button>
            </>
          )
        }
      />

      {error ? (
        <ErrorState
          title="Could not load tasks"
          message={error}
          onRetry={fetchTasks}
        />
      ) : (
        <Card>
          {/* Filter bar: controls sit on one rail above the table, not in their own card. */}
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Filter by title or description"
                aria-label="Filter tasks"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger
                aria-label="Category"
                className="sm:w-[11rem]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger aria-label="Tag" className="sm:w-[10rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-3.5" />
                Clear
              </Button>
            )}
          </div>

          {isLoading ? (
            <TableSkeleton rows={8} columns={4} />
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title={hasFilters ? 'No tasks match these filters' : 'No tasks yet'}
              description={
                hasFilters
                  ? 'Try a shorter search term, or clear the category and tag filters.'
                  : 'A task holds the brief students answer and the criteria their work is scored against.'
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : isAdminOrReviewer ? (
                  <Button asChild size="sm">
                    <Link to="/dashboard/tasks/create">
                      <Plus className="size-4" />
                      New task
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <tr>
                    <Th className="md:w-1/2">Task</Th>
                    <Th className="hidden md:table-cell">Categories</Th>
                    <Th className="hidden lg:table-cell">Tags</Th>
                    <Th numeric className="hidden w-20 sm:table-cell">
                      Criteria
                    </Th>
                    <Th className="w-px text-right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </THead>
                <TBody>
                  {filteredTasks.map((task) => (
                    <Tr key={task.id}>
                      <Td>
                        <Link
                          to={`/dashboard/tasks/${task.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {task.title}
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      </Td>
                      <Td className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {task.categories?.length ? (
                            task.categories.map((category) => (
                              <Badge key={category}>{category}</Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </Td>
                      <Td className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {task.tags?.length ? (
                            task.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </Td>
                      <Td
                        numeric
                        className="hidden text-muted-foreground sm:table-cell"
                      >
                        {task.criteria.length}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isStudent && (
                            <Button asChild size="sm">
                              <Link
                                to={`/dashboard/tasks/${task.id}/submit-solution`}
                              >
                                Solve
                              </Link>
                            </Button>
                          )}
                          {isAdminOrReviewer && (
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/dashboard/tasks/${task.id}/edit`}>
                                Edit
                              </Link>
                            </Button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          )}

          {!isLoading && filteredTasks.length > 0 && (
            <Pagination
              currentPage={pagination.page || 1}
              totalPages={paginationMeta.totalPages}
              pageSize={pagination.size || 20}
              total={paginationMeta.total}
              onPageChange={(page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
              onPageSizeChange={(size) =>
                setPagination((prev) => ({ ...prev, size, page: 1 }))
              }
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default TasksPage;
