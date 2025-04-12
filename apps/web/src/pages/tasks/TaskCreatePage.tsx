import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Button, FormInput, FormTextarea, Alert } from '@/components/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/api';
import { useToast } from '@/hooks';

// Validation schema
const criterionSchema = z.object({
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

const TaskCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      authorSolution: '',
      criteria: [{ name: '', description: '', maxPoints: 10 }],
    },
  });

  // Field array for dynamic criteria
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  });

  // Mutation for creating a task
  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => tasksService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Task created successfully!', 'success');
      navigate(`/tasks/${data.id}`);
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      setError('Failed to create task. Please try again.');
    },
  });

  const onSubmit = (data: TaskFormData) => {
    setError(null);
    createTaskMutation.mutate(data);
  };

  const addCriterion = () => {
    append({ name: '', description: '', maxPoints: 10 });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Create Task</h1>
        <Button
          variant="ghost"
          onClick={() => navigate('/tasks')}
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
                  defaultValue={10}
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
            onClick={() => navigate('/tasks')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createTaskMutation.isPending}
          >
            Create Task
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreatePage;
