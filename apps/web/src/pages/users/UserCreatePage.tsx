import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Button, FormInput, FormSelect, Alert } from '@/components/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/api';
import { UserRole } from '@/types';
import { useToast } from '@/hooks';

// Validation schema
const userSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT]),
});

type UserFormData = z.infer<typeof userSchema>;

const UserCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
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

  // Mutation for creating a user
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User created successfully!', 'success');
      navigate('/users');
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      if (error.response?.status === 409) {
        setError('A user with this email already exists.');
      } else {
        setError('Failed to create user. Please try again.');
      }
    },
  });

  const onSubmit = (data: UserFormData) => {
    setError(null);
    createUserMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Create User</h1>
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
            placeholder="Enter password"
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
              isLoading={createUserMutation.isPending}
            >
              Create User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UserCreatePage;
