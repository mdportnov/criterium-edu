import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Button, FormInput, Alert } from '@/components/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/api';
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/hooks';

// Validation schema
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  currentPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => !data.newPassword || data.currentPassword, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };
      
      // Add password only if new password is provided
      if (data.newPassword) {
        Object.assign(payload, { password: data.newPassword });
      }
      
      return usersService.update(user.id, payload);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      showToast('Profile updated successfully!', 'success');
      
      // Reset password fields
      reset({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      if (error.response?.status === 409) {
        setError('This email is already in use.');
      } else if (error.response?.status === 401) {
        setError('Current password is incorrect.');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setError(null);
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Error">
          User not authenticated.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-header text-gray-900">My Profile</h1>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title={<span className="text-gray-800">Personal Information</span>}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="First Name"
                  name="firstName"
                  register={register}
                  error={errors.firstName}
                  placeholder="Enter your first name"
                />

                <FormInput
                  label="Last Name"
                  name="lastName"
                  register={register}
                  error={errors.lastName}
                  placeholder="Enter your last name"
                />
              </div>

              <FormInput
                label="Email"
                name="email"
                type="email"
                register={register}
                error={errors.email}
                placeholder="Enter your email address"
              />

              <div className="divider">Change Password (Optional)</div>

              <FormInput
                label="Current Password"
                name="currentPassword"
                type="password"
                register={register}
                error={errors.currentPassword}
                placeholder="Enter your current password"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="New Password"
                  name="newPassword"
                  type="password"
                  register={register}
                  error={errors.newPassword}
                  placeholder="Enter new password"
                />

                <FormInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  register={register}
                  error={errors.confirmPassword}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card title={<span className="text-gray-800">Account Information</span>}>
            <div className="flex items-center mb-6">
              <div className="avatar placeholder mr-4">
                <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                  <span className="text-xl">
                    {user.firstName?.[0] || ''}
                    {user.lastName?.[0] || ''}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {user.firstName || 'User'} {user.lastName || ''}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800">Role:</h3>
                <div className="badge badge-lg mt-1">
                  {user.role}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">Member Since:</h3>
                <p className="text-gray-700">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">Last Updated:</h3>
                <p className="text-gray-700">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
