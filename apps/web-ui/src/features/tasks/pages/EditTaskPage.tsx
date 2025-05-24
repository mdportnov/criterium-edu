import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskService } from '@/services';
import type { Task, TaskCriterion, UpdateTaskRequest } from '@/types';

const EditTaskPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState<UpdateTaskRequest>({
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

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;

      setIsLoading(true);
      setError('');

      try {
        const taskId = parseInt(id, 10);
        const taskData = await TaskService.getTaskById(taskId);
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
      } catch (err: any) {
        console.error('Error fetching task:', err);
        setError(
          err.response?.data?.message ||
            'Failed to load task. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [id]);

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
      navigate(`/dashboard/tasks/${task.id}`);
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(
        err.response?.data?.message ||
          'Failed to update task. Please try again.',
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
      navigate('/dashboard/tasks');
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(
        err.response?.data?.message ||
          'Failed to delete task. Please try again.',
      );
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Link to="/dashboard/tasks" className="hover:text-primary">
          Tasks
        </Link>
        <span>/</span>
        <Link to={`/dashboard/tasks/${id}`} className="hover:text-primary">
          Task #{id}
        </Link>
        <span>/</span>
        <span>Edit</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Task</h1>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isSaving}
        >
          Delete Task
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter detailed task description"
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Categories & Tags</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryInput">Categories</Label>
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
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.categories?.map((category) => (
                  <span
                    key={category}
                    className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => removeCategory(category)}
                      className="text-primary hover:text-primary/80 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tagInput">Tags</Label>
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
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground text-sm px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Evaluation Criteria</h2>

          <div className="space-y-6 mb-6">
            {formData.criteria.map((criterion, index) => (
              <div key={index} className="border border-border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{criterion.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-sm px-2 py-1 rounded">
                      {criterion.maxPoints} points
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCriterion(index)}
                      className="text-destructive hover:text-destructive/80 focus:outline-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="text-muted-foreground">{criterion.description}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-medium mb-4">Add New Criterion</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="criterionName">Name</Label>
                <Input
                  id="criterionName"
                  name="name"
                  value={newCriterion.name}
                  onChange={handleCriterionChange}
                  placeholder="e.g., Code Quality"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="criterionDescription">Description</Label>
                <textarea
                  id="criterionDescription"
                  name="description"
                  value={newCriterion.description}
                  onChange={handleCriterionChange}
                  placeholder="Describe what this criterion evaluates"
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="criterionMaxPoints">Maximum Points</Label>
                <Input
                  id="criterionMaxPoints"
                  name="maxPoints"
                  type="number"
                  min="1"
                  value={newCriterion.maxPoints}
                  onChange={handleCriterionChange}
                />
              </div>

              <Button
                type="button"
                onClick={addCriterion}
                variant="outline"
                className="w-full"
              >
                Add Criterion
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Author Solution</h2>

          <div className="space-y-2">
            <Label htmlFor="authorSolution">Reference Solution</Label>
            <textarea
              id="authorSolution"
              name="authorSolution"
              value={formData.authorSolution}
              onChange={handleChange}
              placeholder="Provide a reference solution or implementation (only visible to reviewers and admins)"
              className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/tasks/${id}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTaskPage;
