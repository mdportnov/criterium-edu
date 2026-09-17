import * as React from 'react';

import { cn } from '@/lib/utils';

/*
 * The mark: a C whose aperture holds a single square — a criterion, and the score
 * sitting in it. Drawn on a 32-unit grid so the 4.4 stroke and the 4-unit mark land on
 * whole pixels at 16/32/64px; the aperture is wide enough that the counter never closes
 * into a "G" at nav size.
 *
 * `tone="brand"` is the accent tile with a knocked-out mark and is what the header, the
 * auth lockup and the favicon use — a solid tile sits correctly on both the light and
 * the dark card surface without a per-theme variant. `tone="current"` drops the tile and
 * draws the glyph in `currentColor`, for monochrome contexts.
 *
 * Kept in sync by hand with `public/logo.svg`, which serves the favicon.
 */
export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  tone?: 'brand' | 'current';
}

export function Logo({
  tone = 'brand',
  className,
  ...props
}: LogoProps) {
  const brand = tone === 'brand';
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-5 shrink-0', className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {brand && (
        <path
          d="M0 9a9 9 0 0 1 9-9h14a9 9 0 0 1 9 9v14a9 9 0 0 1-9 9H9a9 9 0 0 1-9-9z"
          fill="hsl(var(--primary))"
        />
      )}
      <path
        d="M19.2 22.1A7 7 0 1 1 19.2 9.9"
        fill="none"
        stroke={brand ? 'hsl(var(--primary-foreground))' : 'currentColor'}
        strokeWidth="4.4"
      />
      <rect
        x="18.6"
        y="14.1"
        width="4"
        height="3.9"
        rx="1.05"
        fill={brand ? 'hsl(var(--primary-foreground))' : 'currentColor'}
      />
    </svg>
  );
}

/** Mark plus wordmark, at the one size and spacing the product uses. */
export function Wordmark({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'lg';
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Logo className={size === 'lg' ? 'size-6' : 'size-5'} />
      <span
        className={cn(
          'font-semibold tracking-tight text-foreground',
          size === 'lg' ? 'text-[15px]' : 'text-[13px]',
        )}
      >
        Criterium
      </span>
    </span>
  );
}
