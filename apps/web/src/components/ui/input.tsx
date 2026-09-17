import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-[13px] text-foreground transition-colors',
          'placeholder:text-muted-foreground',
          'file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-foreground',
          'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25',
          'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
