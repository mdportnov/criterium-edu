import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badge';
import { UserService } from '@/services';
import type { UpdateUserRequest } from '@/types';
import { getErrorMessage } from '@/lib/errors';

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

      if (formData.newPassword && formData.currentPassword) {
        updateData.password = formData.newPassword;
      }

      await UserService.updateProfile(updateData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);

      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      window.location.reload();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Card>
        <LoadingState label="Loading profile…" />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Profile"
        description="Your account details and password."
        actions={
          !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit profile</Button>
          )
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Account details</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="firstName" required>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field label="Last name" htmlFor="lastName" required>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </Field>
              </div>

              <Field label="Email" htmlFor="email" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Field>

              <div className="space-y-4 border-t border-border pt-4">
                <p className="text-[13px] font-semibold text-foreground">
                  Change password
                </p>

                <Field label="Current password" htmlFor="currentPassword">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="New password" htmlFor="newPassword">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />
                  </Field>

                  <Field label="Confirm new password" htmlFor="confirmPassword">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </Field>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Save changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      ) : (
        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Account details</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  First name
                </p>
                <p className="mt-1 text-[13px] text-foreground">
                  {user?.firstName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Last name
                </p>
                <p className="mt-1 text-[13px] text-foreground">
                  {user?.lastName}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="mt-1 text-[13px] text-foreground">{user?.email}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Role</p>
              <div className="mt-1">
                <StatusBadge status={user?.role} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Member since
              </p>
              <p className="mt-1 text-[13px] text-foreground">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
