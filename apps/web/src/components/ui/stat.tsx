import * as React from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

/*
 * A KPI is a label, a number and (optionally) one line of context. The number is
 * `foreground`, never blue/green/purple: colour here would rank the metrics against
 * each other for no reason. Weight and size carry the hierarchy; tabular figures keep
 * a row of them optically aligned.
 *
 * Stats live in a StatRow, which draws them as one bordered strip with hairline
 * dividers rather than four floating cards — denser, and it reads as one instrument
 * panel instead of four competing ones.
 */
export interface StatProps {
  label: string;
  value: React.ReactNode;
  /** One short line under the number. Not a sentence. */
  hint?: string;
  /** Makes the whole tile a link to the screen that explains the number. */
  to?: string;
  className?: string;
}

export function Stat({ label, value, hint, to, className }: StatProps) {
  const body = (
    <>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold leading-8 tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{hint}</p>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'block px-4 py-3 transition-colors hover:bg-muted/50',
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn('px-4 py-3', className)}>{body}</div>;
}

export interface StatRowProps extends React.ComponentProps<'div'> {
  /** Columns at the widest breakpoint. Below that it steps down to 2, then 1. */
  columns?: 2 | 3 | 4;
}

const COLUMN_CLASSES: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function StatRow({ className, columns = 4, ...props }: StatRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 divide-y divide-border rounded-md border border-border bg-card sm:divide-y-0 sm:divide-x',
        COLUMN_CLASSES[columns],
        // At 2/3/4 columns the grid wraps, so restore the horizontal rule between rows.
        columns === 4 &&
          'sm:[&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-border lg:[&>*:nth-child(n+3)]:border-t-0',
        columns === 3 &&
          'sm:[&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-border lg:[&>*:nth-child(n+3)]:border-t-0',
        className,
      )}
      {...props}
    />
  );
}

/*
 * A compact breakdown: label / count pairs on one line, used where a status split
 * would otherwise become four more coloured tiles.
 */
export interface StatInlineItem {
  label: string;
  value: React.ReactNode;
}

export function StatInline({
  items,
  className,
}: {
  items: StatInlineItem[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold leading-6 tabular-nums text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
