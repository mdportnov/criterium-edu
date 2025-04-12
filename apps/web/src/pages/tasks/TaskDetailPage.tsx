import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Alert } from '@/components/common';
import { tasksService, taskSolutionsService } from '@/api';
import { useAuth } from '@/context/AuthContext.tsx';
import { UserRole, TaskSolutionStatus } from '@/types';
import { FormTextarea } from '@/components/common';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks';

const solutionSchema = z.object({
  solutionText: z.string().min(10, 'Solution must be at least 10 characters'),
});

type SolutionFormData = z.infer<typeof solutionSchema>;

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Get task details
  const { 
    data: task, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksService.getById(Number(taskId)),
    enabled: !!taskId,
  });
  
  // Check if user has already submitted a solution
  const { 
    data: userSolutions, 
    isLoading: solutionsLoading 
  } = useQuery({
    queryKey: ['userSolutions', taskId, user?.id],
    queryFn: () => user ? taskSolutionsService.getAllByStudentId(user.id) : Promise.resolve([]),
    enabled: !!user && user.role === UserRole.STUDENT,
  });
  
  const existingSolution = userSolutions?.find(
    solution => solution.taskId === Number(taskId)
  );
  
  // Form setup for solution submission
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SolutionFormData>({
    resolver: zodResolver(solutionSchema),
  });
  
  // Mutation for submitting a solution
  const submitSolutionMutation = useMutation({
    mutationFn: (data: SolutionFormData) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return taskSolutionsService.create({
        taskId: Number(taskId),
        solutionText: data.solutionText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSolutions'] });
      showToast('Solution submitted successfully!', 'success');
    },
    onError: (error) => {
      console.error('Error submitting solution:', error);
      setSubmitError('Failed to submit solution. Please try again.');
    },
  });
  
  // Mutation for deleting a task
  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksService.delete(Number(taskId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Task deleted successfully!', 'success');
      navigate('/tasks');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task. Please try again.', 'error');
    },
  });
  
  const onSubmitSolution = (data: SolutionFormData) => {
    setSubmitError(null);
    submitSolutionMutation.mutate(data);
  };
  
  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (error || !task) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Error">
          Failed to load task details. Please try again.
        </Alert>
        <div className="mt-4">
          <Link to="/tasks" className="btn btn-primary">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="page-header mb-0">{task.title}</h1>
        <div className="flex gap-2">
          <Link to="/tasks" className="btn btn-ghost">
            Back to Tasks
          </Link>
          {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && (
            <>
              <Link to={`/tasks/${taskId}/edit`} className="btn btn-secondary">
                Edit Task
              </Link>
              <Button
                variant="error"
                onClick={handleDeleteTask}
                isLoading={deleteTaskMutation.isPending}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Card title="Task Description">
        <div className="whitespace-pre-wrap">
          {task.description}
        </div>
      </Card>
      
      <Card title="Evaluation Criteria">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Description</th>
                <th>Max Points</th>
              </tr>
            </thead>
            <tbody>
              {task.criteria.map((criterion) => (
                <tr key={criterion.id}>
                  <td className="font-medium">{criterion.name}</td>
                  <td>{criterion.description}</td>
                  <td>{criterion.maxPoints}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2}>Total</th>
                <th>
                  {task.criteria.reduce((sum, criterion) => sum + Number(criterion.maxPoints), 0)}
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      
      {user?.role === UserRole.STUDENT && (
        <Card title="Submit Your Solution">
          {existingSolution ? (
            <div>
              <div className="alert alert-info mb-4">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>
                    You've already submitted a solution for this task. Current status: 
                    <span className="badge badge-ghost ml-2">
                      {existingSolution.status}
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="card bg-base-200 p-4 rounded-box">
                <h3 className="font-semibold mb-2">Your Submission:</h3>
                <div className="whitespace-pre-wrap">
                  {existingSolution.solutionText}
                </div>
              </div>
              
              <div className="mt-4">
                <Link 
                  to={`/solutions/${existingSolution.id}`} 
                  className="btn btn-primary"
                >
                  View Full Solution
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitSolution)}>
              {submitError && (
                <Alert variant="error" className="mb-4">
                  {submitError}
                </Alert>
              )}
              
              <FormTextarea
                label="Your Solution"
                name="solutionText"
                register={register}
                error={errors.solutionText}
                placeholder="Write your solution here..."
                rows={10}
              />
              
              <div className="mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitSolutionMutation.isPending}
                >
                  Submit Solution
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
      
      {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && task.authorSolution && (
        <Card title="Author Solution (Only visible to mentors and admins)">
          <div className="whitespace-pre-wrap">
            {task.authorSolution}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TaskDetailPage;
