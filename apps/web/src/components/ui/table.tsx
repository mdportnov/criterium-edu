import * as React from 'react';

import { cn } from '@/lib/utils';

/*
 * Dense data table. Rows are 36px, separated by hairlines only — no zebra striping,
 * no row shadows. Numeric cells opt into tabular figures via <Td numeric> so columns
 * of numbers line up digit for digit.
 *
 * Wrap in <TableWrap> to get the horizontal scroll container that keeps narrow
 * viewports from scrolling the whole page sideways.
 */
function TableWrap({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]',
        className,
      )}
      {...props}
    />
  );
}

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <table
      className={cn('w-full caption-bottom border-collapse text-[13px]', className)}
      {...props}
    />
  );
}

function THead({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('border-b border-border bg-muted/50', className)}
      {...props}
    />
  );
}

function TBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn('divide-y divide-border', className)}
      {...props}
    />
  );
}

function Tr({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn('transition-colors hover:bg-muted/40', className)}
      {...props}
    />
  );
}

export interface ThProps extends React.ComponentProps<'th'> {
  numeric?: boolean;
}

function Th({ className, numeric, ...props }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        'h-8 px-3 text-left align-middle text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap',
        numeric && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

export interface TdProps extends React.ComponentProps<'td'> {
  numeric?: boolean;
}

function Td({ className, numeric, ...props }: TdProps) {
  return (
    <td
      className={cn(
        'px-3 py-2 align-middle text-foreground',
        numeric && 'text-right tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

/** Secondary text inside a cell — emails, timestamps, counts. */
function TdMuted({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export { TableWrap, Table, THead, TBody, Tr, Th, Td, TdMuted };
