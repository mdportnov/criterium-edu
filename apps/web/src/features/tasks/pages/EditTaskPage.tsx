import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TaskService } from '@/services';
import type { Task, TaskCriterion, UpdateTaskRequest } from '@/types';
import { X } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

const EditTaskPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState<Task | null>(null);

  /**
   * The form always holds concrete values; UpdateTaskRequest makes every field
   * optional because it describes a partial update. Typing the state as the
   * request shape meant every read had to cope with undefined that could not
   * occur.
   */
  type TaskFormState = Required<
    Pick<UpdateTaskRequest, 'title' | 'description' | 'criteria'>
  > &
    Pick<UpdateTaskRequest, 'authorSolution'> & {
      categories: string[];
      tags: string[];
    };

  const [formData, setFormData] = useState<TaskFormState>({
    title: '',
    description: '',
    authorSolution: '',
    categories: [],
    tags: [],
    criteria: [],
  });

  const [categoryInput, setCategoryInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [newCriterion, setNewCriterion] = useState<TaskCriterion>({
    name: '',
    description: '',
    maxPoints: 10,
  });

  const fetchTask = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      const taskData = await TaskService.getTaskById(id);
      setTask(taskData);

      // Initialize form data with task data
      setFormData({
        title: taskData.title,
        description: taskData.description,
        authorSolution: taskData.authorSolution || '',
        categories: taskData.categories || [],
        tags: taskData.tags || [],
        criteria: taskData.criteria || [],
      });
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(getErrorMessage(err, 'Failed to load task. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchTask();
  }, [fetchTask]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCriterionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNewCriterion((prev) => ({
      ...prev,
      [name]: name === 'maxPoints' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const addCriterion = () => {
    if (
      !newCriterion.name ||
      !newCriterion.description ||
      newCriterion.maxPoints <= 0
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { ...newCriterion }],
    }));

    setNewCriterion({
      name: '',
      description: '',
      maxPoints: 10,
    });
  };

  const removeCriterion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const addCategory = () => {
    if (
      !categoryInput.trim() ||
      formData.categories?.includes(categoryInput.trim())
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      categories: [...(prev.categories || []), categoryInput.trim()],
    }));

    setCategoryInput('');
  };

  const removeCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories?.filter((c) => c !== category) || [],
    }));
  };

  const addTag = () => {
    if (!tagInput.trim() || formData.tags?.includes(tagInput.trim())) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()],
    }));

    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const totalPoints = formData.criteria.reduce(
    (sum, criterion) => sum + criterion.maxPoints,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task) return;
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.criteria.length === 0) {
      setError('At least one criterion is required');
      return;
    }

    setIsSaving(true);

    try {
      await TaskService.updateTask(task.id, formData);
      void navigate(`/dashboard/tasks/${task.id}`);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(
        getErrorMessage(err, 'Failed to update task. Please try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    if (
      !window.confirm(
        'Are you sure you want to delete this task? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      await TaskService.deleteTask(task.id);
      void navigate('/dashboard/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(
        getErrorMessage(err, 'Failed to delete task. Please try again.'),
      );
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Edit task" backTo="/dashboard/tasks" />
        <LoadingState label="Loading task…" />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Edit task" backTo="/dashboard/tasks" />
        <ErrorState
          title="Could not load task"
          message={error}
          onRetry={() => void fetchTask()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit task"
        description={task ? task.title : undefined}
        backTo={`/dashboard/tasks/${id}`}
        actions={
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={isSaving}
          >
            Delete task
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Basic information</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Title" htmlFor="title" required>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </Field>

            <Field label="Description" htmlFor="description" required>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter detailed task description"
                className="min-h-32"
                required
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Categories & tags</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Field label="Categories" htmlFor="categoryInput">
                <div className="flex gap-2">
                  <Input
                    id="categoryInput"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    placeholder="Add a category"
                  />
                  <Button type="button" onClick={addCategory} variant="outline">
                    Add
                  </Button>
                </div>
              </Field>

              {formData.categories && formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="accent"
                      className="gap-1 pr-1"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="rounded-sm hover:bg-primary/15"
                        aria-label={`Remove category ${category}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Field label="Tags" htmlFor="tagInput">
                <div className="flex gap-2">
                  <Input
                    id="tagInput"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
              </Field>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="neutral" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-sm hover:bg-border"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Evaluation criteria</CardTitle>
            </CardHeaderText>
            {formData.criteria.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Total{' '}
                <span className="tabular-nums font-medium text-foreground">
                  {totalPoints}
                </span>{' '}
                pts
              </span>
            )}
          </CardHeader>

          {formData.criteria.length > 0 && (
            <div className="divide-y divide-border border-b border-border">
              {formData.criteria.map((criterion, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {criterion.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {criterion.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {criterion.maxPoints} pts
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeCriterion(index)}
                      aria-label={`Remove criterion ${criterion.name}`}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <CardContent className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground">
              Add new criterion
            </p>

            <Field label="Name" htmlFor="criterionName">
              <Input
                id="criterionName"
                name="name"
                value={newCriterion.name}
                onChange={handleCriterionChange}
                placeholder="e.g., Code Quality"
              />
            </Field>

            <Field label="Description" htmlFor="criterionDescription">
              <Textarea
                id="criterionDescription"
                name="description"
                value={newCriterion.description}
                onChange={handleCriterionChange}
                placeholder="Describe what this criterion evaluates"
                className="min-h-20"
              />
            </Field>

            <Field label="Maximum points" htmlFor="criterionMaxPoints">
              <Input
                id="criterionMaxPoints"
                name="maxPoints"
                type="number"
                min="1"
                value={newCriterion.maxPoints}
                onChange={handleCriterionChange}
              />
            </Field>

            <Button
              type="button"
              onClick={addCriterion}
              variant="outline"
              className="w-full"
            >
              Add criterion
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Author solution</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent>
            <Field label="Reference solution" htmlFor="authorSolution">
              <Textarea
                id="authorSolution"
                name="authorSolution"
                value={formData.authorSolution}
                onChange={handleChange}
                placeholder="Provide a reference solution or implementation (only visible to reviewers and admins)"
                className="min-h-32 font-mono"
              />
            </Field>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => void navigate(`/dashboard/tasks/${id}`)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default EditTaskPage;
