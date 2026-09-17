/*
 * Single source of truth for "which tone does this domain status get" and how it is
 * spelled. Screens must not pick tones ad hoc, or the same status ends up two colours
 * and two spellings in two places.
 *
 * Tones map onto the four status hues in the theme — the only colour in the product
 * that is allowed to mean something.
 */
export type StatusTone =
  | 'neutral'
  | 'outline'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const STATUS_TONES: Record<string, StatusTone> = {
  // solutions
  pending: 'warning',
  submitted: 'info',
  in_review: 'info',
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

function normalise(status: string): string {
  return status.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return 'neutral';
  return STATUS_TONES[normalise(String(status))] ?? 'neutral';
}

/** Humanises `IN_REVIEW` / `in-review` into `In review`. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  const s = String(status).toLowerCase().replace(/[_-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
