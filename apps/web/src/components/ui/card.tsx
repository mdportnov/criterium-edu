import * as React from 'react';

import { cn } from '@/lib/utils';

/*
 * A card is a hairline border on the card surface. No shadow, no hover lift: cards are
 * containers, not buttons, and a page full of lifting cards reads as a marketing page.
 * Anatomy is fixed everywhere — CardHeader (title + optional description + optional
 * action) / CardContent / optional CardFooter — so every section on every screen has
 * the same rhythm.
 */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground rounded-md border border-border',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'flex items-start justify-between gap-3 px-4 py-3 border-b border-border',
        className,
      )}
      {...props}
    />
  );
}

function CardHeaderText({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header-text"
      className={cn('min-w-0 space-y-0.5', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="card-title"
      className={cn(
        'text-[13px] font-semibold leading-5 tracking-tight text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-xs leading-5 text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-content" className={cn('p-4', className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center gap-2 border-t border-border px-4 py-2.5',
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardHeaderText,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
