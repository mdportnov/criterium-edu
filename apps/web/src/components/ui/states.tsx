import * as React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/*
 * The three states every data surface in this product has to render, in one place so
 * they cannot drift apart screen by screen.
 *
 * Rules:
 *  - An empty state is a sentence and an action, never a bare "0" and never an
 *    illustration. It says what would be here and how to put something here.
 *  - Errors say what failed and offer the retry; they do not shout in red fills.
 *  - Loading is a quiet inline row, or a skeleton where the shape is known.
 */

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  /** One line. What would live here, and why it is empty. */
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-10 text-center',
        className,
      )}
    >
      {Icon && (
        <Icon className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
      )}
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = 'Loading…',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-10 text-[13px] text-muted-foreground',
        className,
      )}
      role="status"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('size-4 animate-spin text-muted-foreground', className)}
      aria-hidden="true"
    />
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-4 py-3',
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          className="mt-0.5 size-4 shrink-0 text-danger"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground">{title}</p>
          {message && (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-6">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/** Grey block that stands in for content while it loads. */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-muted', className)}
      {...props}
    />
  );
}

/** Rows of skeletons sized to a table body, so the page does not jump on load. */
export function TableSkeleton({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 px-3 py-2.5">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5"
              style={{ width: c === 0 ? '28%' : `${Math.round(60 / columns)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
