import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/*
 * Inline message block. Tinted background + readable text, same four status tones as
 * Badge — never a saturated fill, and never used decoratively to "break up" a page.
 */
const alertVariants = cva(
  "relative grid w-full items-start gap-x-2.5 gap-y-0.5 rounded-md border px-3 py-2.5 text-[13px] grid-cols-[0_1fr] has-[>svg]:grid-cols-[1rem_1fr] [&>svg]:size-4 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: 'border-border bg-muted/60 text-foreground [&>svg]:text-muted-foreground',
        info: 'border-info/25 bg-info-soft text-foreground [&>svg]:text-info',
        success:
          'border-success/25 bg-success-soft text-foreground [&>svg]:text-success',
        warning:
          'border-warning/25 bg-warning-soft text-foreground [&>svg]:text-warning',
        destructive:
          'border-danger/25 bg-danger-soft text-foreground [&>svg]:text-danger',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 font-medium leading-5', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 text-xs leading-5 text-muted-foreground [&_p]:leading-5',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
