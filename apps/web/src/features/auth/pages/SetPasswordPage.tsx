import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/errors';

const MIN_LENGTH = 8;

/**
 * Redeems the one-time link an administrator issues. Accounts created by bulk
 * import have a random password nobody holds, so this is how they first get in.
 */
const SetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }

    if (password !== confirmation) {
      setError('The two passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await AuthService.setPassword(token, password);
      void navigate('/login', { replace: true });
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'This link is invalid or has expired. Ask an administrator for a new one.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Link incomplete
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            This page needs the one-time link an administrator sent you. Open it
            again in full, or ask for a new one.
          </p>
        </div>
        <Link
          to="/login"
          className="text-[13px] font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Set your password
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Choose a password for your account. The link works once.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="New password"
          htmlFor="password"
          required
          hint={`At least ${MIN_LENGTH} characters`}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </Field>

        <Field label="Confirm password" htmlFor="confirmation" required>
          <Input
            id="confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
          />
        </Field>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Set password'}
        </Button>
      </form>

      <p className="text-center text-[13px] text-muted-foreground">
        Already have a password?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SetPasswordPage;
