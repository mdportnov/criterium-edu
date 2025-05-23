import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Task, UserRole } from '@/types';
import { TaskService } from '@/services';
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  Tag,
  Folder,
  ArrowRight,
  Edit3,
  Play,
  AlertCircle,
} from 'lucide-react';

const TasksPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const isAdminOrReviewer = hasRole([UserRole.ADMIN, UserRole.REVIEWER]);

  // Extract unique categories and tags from tasks
  const categories = [
    ...new Set(tasks.flatMap((task) => task.categories || [])),
  ];
  const tags = [...new Set(tasks.flatMap((task) => task.tags || []))];

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError('');

      try {
        const tasksData = await TaskService.getTasks();
        setTasks(tasksData);
        setFilteredTasks(tasksData);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Filter tasks based on search term, category, and tag
  useEffect(() => {
    let result = tasks;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term),
      );
    }

    if (selectedCategory) {
      result = result.filter((task) =>
        task.categories?.includes(selectedCategory),
      );
    }

    if (selectedTag) {
      result = result.filter((task) => task.tags?.includes(selectedTag));
    }

    setFilteredTasks(result);
  }, [searchTerm, selectedCategory, selectedTag, tasks]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-6 rounded-lg border border-destructive/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">Error Loading Tasks</h3>
        </div>
        <p className="mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-destructive/20 hover:bg-destructive/10"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Tasks Library
          </h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} tasks available to practice
          </p>
        </div>

        {isAdminOrReviewer && (
          <Button asChild className="transition-all duration-200 hover:shadow-lg">
            <Link to="/dashboard/tasks/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </label>
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Category
            </label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-muted-foreground/50 appearance-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tag
            </label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-muted-foreground/50 appearance-none cursor-pointer"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters display */}
        {(searchTerm || selectedCategory || selectedTag) && (
          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-border/50">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:text-primary/70 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-1 hover:text-primary/70 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Tag: {selectedTag}
                <button
                  onClick={() => setSelectedTag('')}
                  className="ml-1 hover:text-primary/70 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tasks found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory || selectedTag
              ? 'Try adjusting your search filters'
              : 'No tasks have been created yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-card rounded-lg shadow-sm border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary/20 group"
            >
              {/* Task Header */}
              <div className="p-6 flex-grow space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    <Link to={`/dashboard/tasks/${task.id}`} className="hover:underline">
                      {task.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground line-clamp-3">
                    {task.description}
                  </p>
                </div>

                {/* Categories */}
                {task.categories && task.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {task.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        <Folder className="w-3 h-3" />
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Footer */}
              <div className="bg-muted/30 px-6 py-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {task.criteria.length} criteria
                  </span>

                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/dashboard/tasks/${task.id}`}>
                        View
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>

                    {hasRole(UserRole.STUDENT) && (
                      <Button asChild size="sm" className="gap-1">
                        <Link to={`/dashboard/tasks/${task.id}/submit-solution`}>
                          <Play className="w-4 h-4" />
                          Solve
                        </Link>
                      </Button>
                    )}

                    {isAdminOrReviewer && (
                      <Button asChild variant="outline" size="sm" className="gap-1">
                        <Link to={`/dashboard/tasks/${task.id}/edit`}>
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
