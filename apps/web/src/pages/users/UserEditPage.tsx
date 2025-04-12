import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Button, FormInput, FormSelect, Alert } from '@/components/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/api';
import { UserRole } from '@/types';
import { useToast } from '@/hooks';

// Validation schema
const userSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum([UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT]),
});

type UserFormData = z.infer<typeof userSchema>;

const UserEditPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.getById(Number(userId)),
    enabled: !!userId,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: UserRole.STUDENT,
    },
  });

  // Reset form when user data is loaded
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
      });
    }
  }, [user, reset]);

  // Mutation for updating a user
  const updateUserMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      // If password is empty, remove it from the payload
      const payload = { ...data };
      if (!payload.password) {
        delete payload.password;
      }
      return usersService.update(Number(userId), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      showToast('User updated successfully!', 'success');
      navigate('/users');
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      if (error.response?.status === 409) {
        setError('A user with this email already exists.');
      } else {
        setError('Failed to update user. Please try again.');
      }
    },
  });

  const onSubmit = (data: UserFormData) => {
    setError(null);
    updateUserMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Error">
          Failed to load user details. Please try again.
        </Alert>
        <div className="mt-4">
          <Button
            variant="primary"
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Edit User: {user.firstName} {user.lastName}</h1>
        <Button
          variant="ghost"
          onClick={() => navigate('/users')}
        >
          Cancel
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="First Name"
              name="firstName"
              register={register}
              error={errors.firstName}
              placeholder="Enter first name"
            />

            <FormInput
              label="Last Name"
              name="lastName"
              register={register}
              error={errors.lastName}
              placeholder="Enter last name"
            />
          </div>

          <FormInput
            label="Email"
            name="email"
            type="email"
            register={register}
            error={errors.email}
            placeholder="Enter email address"
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password}
            placeholder="Leave blank to keep current password"
            helperText="Leave blank to keep the current password"
          />

          <FormSelect
            label="Role"
            name="role"
            register={register}
            error={errors.role}
            options={[
              { value: UserRole.STUDENT, label: 'Student' },
              { value: UserRole.MENTOR, label: 'Mentor' },
              { value: UserRole.ADMIN, label: 'Admin' },
            ]}
          />

          <div className="mt-6 flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/users')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateUserMutation.isPending}
            >
              Update User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UserEditPage;
