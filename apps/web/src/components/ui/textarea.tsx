import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-md border border-input bg-card px-2.5 py-2 text-[13px] leading-6 text-foreground transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25',
        'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
