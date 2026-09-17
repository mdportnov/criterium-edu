import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * For endpoints that establish a session rather than act under one: there is
 * no CSRF cookie to compare against yet.
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
