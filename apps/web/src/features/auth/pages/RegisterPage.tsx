import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/states';
import { useAuth } from '@/contexts/AuthContext';
import { settingsService } from '@/services/settings.service';
import { CheckCircle2, Eye, EyeOff, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState<
    boolean | null
  >(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await settingsService.getPublicSettings();
        setRegistrationEnabled(response.data.registration_enabled);
      } catch (err) {
        console.error('Failed to fetch registration status:', err);
        setRegistrationEnabled(false);
      } finally {
        setLoadingSettings(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.email,
        formData.firstName,
        formData.lastName,
        formData.password,
      );
      navigate('/dashboard');
    } catch (err) {
      setError(
        getErrorMessage(err, 'Failed to register. Please try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^\w\s]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

  if (loadingSettings) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Join Criterium EDU to get started.
          </p>
        </div>
        <LoadingState />
      </div>
    );
  }

  if (registrationEnabled === false) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Registration disabled
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Account registration is currently disabled.
          </p>
        </div>

        <Alert variant="info">
          <Info />
          <AlertDescription>
            New user registration is not available now. Please contact support
            if you need access.
          </AlertDescription>
        </Alert>

        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Sign in instead</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Join Criterium EDU to get started.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="firstName" required>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </Field>

          <Field label="Last name" htmlFor="lastName" required>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </Field>
        </div>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className="pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              <span className="sr-only">
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </button>
          </div>
          {formData.password && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password strength</span>
                <span className="font-medium text-foreground">
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 w-full rounded-full',
                      i < passwordStrength ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword" required>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pr-16"
              required
            />
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword && (
                <CheckCircle2
                  className="absolute right-9 top-1/2 size-3.5 -translate-y-1/2 text-success"
                  aria-hidden="true"
                />
              )}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? 'Hide password' : 'Show password'}
              </span>
            </button>
          </div>
        </Field>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in instead
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
