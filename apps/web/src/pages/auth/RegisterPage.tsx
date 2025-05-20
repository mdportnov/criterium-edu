import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/layout';
import { FormInput, Button, Alert } from '@/components/common';
import { useAuth } from '@/context/AuthContext.tsx';
import { RegisterPayload } from '@/types';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData as RegisterPayload);
      // Navigation is handled by the auth context
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.status === 409) {
        setError('Email is already in use. Please try with a different email.');
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Sign up to get started with Criterium EDU"
    >
      {error && (
        <Alert variant="error" title="Registration Error">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormInput
            label="First Name"
            name="firstName"
            type="text"
            placeholder="Enter your first name"
            register={register}
            error={errors.firstName}
            autoComplete="given-name"
            required
          />

          <FormInput
            label="Last Name"
            name="lastName"
            type="text"
            placeholder="Enter your last name"
            register={register}
            error={errors.lastName}
            autoComplete="family-name"
            required
          />
        </div>

        <FormInput
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          register={register}
          error={errors.email}
          autoComplete="email"
          required
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
          placeholder="Create a password"
          register={register}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        <FormInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          register={register}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          isFullWidth
          isLoading={isLoading}
        >
          Create Account
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-base-content/60">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
