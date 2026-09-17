import * as React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';

/*
 * Every screen in the product opens the same way: optional back link, title on the
 * left, optional one-line description under it, actions flush right. Hierarchy comes
 * from size and weight — never from a gradient or an accent-coloured heading.
 */
export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Renders a hairline "back" affordance above the title. */
  backTo?: string;
  backLabel?: string;
  /** Right-aligned actions. The primary action is the only filled button here. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backTo,
  backLabel = 'Back',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-5', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="mb-2 -ml-1 inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-7 tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/** A secondary heading inside a page, for sections that are not in a Card. */
export function SectionHeading({
  className,
  ...props
}: React.ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'text-[13px] font-semibold leading-5 tracking-tight text-foreground',
        className,
      )}
      {...props}
    />
  );
}
