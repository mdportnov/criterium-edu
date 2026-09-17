import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-xs font-medium leading-4 text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className,
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

/** Label + control + optional hint/error, with the spacing every form here uses. */
export function Field({
  label,
  labelAction,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: React.ReactNode;
  /** Right-aligned affordance on the label row, e.g. "Forgot password?". */
  labelAction?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || labelAction) && (
        <div className="flex min-h-4 items-center justify-between gap-3">
          {label ? (
            <Label htmlFor={htmlFor}>
              {label}
              {required && (
                <span className="ml-0.5 text-danger" aria-hidden="true">
                  *
                </span>
              )}
            </Label>
          ) : (
            <span />
          )}
          {labelAction}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs leading-4 text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-4 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export { Label };
