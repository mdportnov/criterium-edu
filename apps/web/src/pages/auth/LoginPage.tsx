import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/layout';
import { FormInput, Button, Alert } from '@/components/common';
import { useAuth } from '@/context/AuthContext.tsx';
import { LoginPayload } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await login(data as LoginPayload);
      // Navigation is handled by the auth context
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthLayout 
      title="Sign in to your account" 
      subtitle="Enter your credentials to access the platform"
    >
      {error && (
        <Alert variant="error" title="Authentication Error">
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          placeholder="Enter your password"
          register={register}
          error={errors.password}
          autoComplete="current-password"
          required
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/forgot-password" className="link link-primary">
              Forgot your password?
            </Link>
          </div>
        </div>
        
        <Button 
          type="submit" 
          variant="primary" 
          isFullWidth 
          isLoading={isLoading}
        >
          Sign in
        </Button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
