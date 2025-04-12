import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Button, FormInput, FormTextarea, Alert } from '@/components/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/api';
import { useToast } from '@/hooks';

// Validation schema
const criterionSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  maxPoints: z.number().min(1, 'Max points must be at least 1'),
});

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  authorSolution: z.string().optional(),
  criteria: z.array(criterionSchema).min(1, 'At least one criterion is required'),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskEditPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch task data
  const { data: task, isLoading, isError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksService.getById(Number(taskId)),
    enabled: !!taskId,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      authorSolution: '',
      criteria: [{ name: '', description: '', maxPoints: 10 }],
    },
  });

  // Reset form when task data is loaded
  React.useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        authorSolution: task.authorSolution || '',
        criteria: task.criteria.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          maxPoints: Number(c.maxPoints),
        })),
      });
    }
  }, [task, reset]);

  // Field array for dynamic criteria
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  });

  // Mutation for updating a task
  const updateTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => tasksService.update(Number(taskId), data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      showToast('Task updated successfully!', 'success');
      navigate(`/tasks/${data.id}`);
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    },
  });

  const onSubmit = (data: TaskFormData) => {
    setError(null);
    updateTaskMutation.mutate(data);
  };

  const addCriterion = () => {
    append({ name: '', description: '', maxPoints: 10 });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Error">
          Failed to load task details. Please try again.
        </Alert>
        <div className="mt-4">
          <Button
            variant="primary"
            onClick={() => navigate('/tasks')}
          >
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Edit Task</h1>
        <Button
          variant="ghost"
          onClick={() => navigate(`/tasks/${taskId}`)}
        >
          Cancel
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card title="Task Details" className="mb-6">
          <FormInput
            label="Title"
            name="title"
            register={register}
            error={errors.title}
            placeholder="Enter task title"
          />

          <FormTextarea
            label="Description"
            name="description"
            register={register}
            error={errors.description}
            placeholder="Enter detailed task description"
            rows={6}
          />

          <FormTextarea
            label="Author Solution (Only visible to mentors and admins)"
            name="authorSolution"
            register={register}
            error={errors.authorSolution}
            placeholder="Provide a reference solution for mentors"
            rows={6}
            helperText="This solution will only be visible to mentors and admins, not to students."
          />
        </Card>

        <Card 
          title="Evaluation Criteria" 
          className="mb-6"
          footer={
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={addCriterion}
              >
                Add Criterion
              </Button>
            </div>
          }
        >
          {errors.criteria?.message && (
            <Alert variant="error" className="mb-4">
              {errors.criteria.message}
            </Alert>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="card bg-base-200 p-4 mb-4 rounded-box">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Criterion #{index + 1}</h3>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="btn-sm"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Keep the original ID for existing criteria */}
              {field.id && (
                <input
                  type="hidden"
                  {...register(`criteria.${index}.id` as const)}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Name"
                  name={`criteria.${index}.name`}
                  register={register}
                  error={errors.criteria?.[index]?.name}
                  placeholder="E.g., Code Quality"
                />

                <FormInput
                  label="Max Points"
                  name={`criteria.${index}.maxPoints`}
                  register={register}
                  error={errors.criteria?.[index]?.maxPoints}
                  type="number"
                  min={1}
                />
              </div>

              <FormTextarea
                label="Description"
                name={`criteria.${index}.description`}
                register={register}
                error={errors.criteria?.[index]?.description}
                placeholder="Describe what this criterion evaluates"
                rows={3}
              />
            </div>
          ))}
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/tasks/${taskId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={updateTaskMutation.isPending}
          >
            Update Task
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskEditPage;
