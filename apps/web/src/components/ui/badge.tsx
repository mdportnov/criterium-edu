import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { statusLabel, statusTone, type StatusTone } from '@/lib/status';

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

export type BadgeTone = StatusTone;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
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
export { statusLabel, statusTone } from '@/lib/status';
