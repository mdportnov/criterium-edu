import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserService } from '@/services';
import type { UpdateUserRequest } from '@/types';

const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords if changing password
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('New password and confirmation do not match');
        return;
      }

      if (!formData.currentPassword) {
        setError('Current password is required to set a new password');
        return;
      }
    }

    setIsLoading(true);

    try {
      const updateData: UpdateUserRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };

      // Only include password fields if changing password
      if (formData.newPassword && formData.currentPassword) {
        updateData.password = formData.newPassword;
      }

      await UserService.updateProfile(updateData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Reload page to refresh user data
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          {success}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4">Change Password</h3>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  First Name
                </h3>
                <p className="mt-1">{user?.firstName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Last Name
                </h3>
                <p className="mt-1">{user?.lastName}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Email
              </h3>
              <p className="mt-1">{user?.email}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Role
              </h3>
              <p className="mt-1 capitalize">{user?.role}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Member Since
              </h3>
              <p className="mt-1">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
