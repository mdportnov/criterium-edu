import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/*
 * The only place colour is allowed to mean something. Four status tones plus two
 * neutrals. Each tone is the quietest tint that still separates from the card, with
 * readable text — never a saturated fill.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border bg-transparent text-foreground',
        accent: 'border-primary/25 bg-primary/10 text-primary',
        success: 'border-success/25 bg-success-soft text-success',
        warning: 'border-warning/25 bg-warning-soft text-warning',
        danger: 'border-danger/25 bg-danger-soft text-danger',
        info: 'border-info/25 bg-info-soft text-info',
        // Back-compat aliases for shadcn's original names, mapped onto the tone system
        // so no call site can reintroduce a saturated fill.
        default: 'border-border bg-muted text-muted-foreground',
        secondary: 'border-border bg-muted text-muted-foreground',
        destructive: 'border-danger/25 bg-danger-soft text-danger',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export type BadgeTone = NonNullable<
  VariantProps<typeof badgeVariants>['variant']
>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/*
 * Single source of truth for "which tone does this domain status get". Screens must
 * not pick tones ad hoc, or the same status ends up two colours in two places.
 */
const STATUS_TONES: Record<string, BadgeTone> = {
  // solutions
  pending: 'warning',
  submitted: 'info',
  in_review: 'info',
  inreview: 'info',
  reviewed: 'success',
  approved: 'success',
  rejected: 'danger',
  // processing / operations
  queued: 'neutral',
  processing: 'info',
  in_progress: 'info',
  running: 'info',
  completed: 'success',
  success: 'success',
  succeeded: 'success',
  failed: 'danger',
  error: 'danger',
  cancelled: 'neutral',
  canceled: 'neutral',
  partial: 'warning',
  skipped: 'neutral',
  // users
  admin: 'accent',
  reviewer: 'info',
  student: 'neutral',
  active: 'success',
  inactive: 'neutral',
  blocked: 'danger',
};

export function statusTone(status: string | null | undefined): BadgeTone {
  if (!status) return 'neutral';
  return STATUS_TONES[String(status).toLowerCase().replace(/[\s-]/g, '_')] ?? 'neutral';
}

/** Humanises `IN_REVIEW` / `in-review` into `In review`. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  const s = String(status).toLowerCase().replace(/[_-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface StatusBadgeProps
  extends Omit<BadgeProps, 'variant' | 'children'> {
  status: string | null | undefined;
  label?: string;
}

/** Renders a domain status with the tone and wording the whole product agrees on. */
export function StatusBadge({ status, label, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={statusTone(status)} {...props}>
      {label ?? statusLabel(status)}
    </Badge>
  );
}

export { Badge, badgeVariants };
