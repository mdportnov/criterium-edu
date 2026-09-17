import type { CookieOptions, Response } from 'express';

export const SESSION_COOKIE = 'criterium_session';
export const CSRF_COOKIE = 'criterium_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/**
 * The access token lives in an httpOnly cookie, so script running in the page
 * cannot read it. It used to be handed to the browser in the response body and
 * kept in localStorage, where any XSS could lift it.
 *
 * SameSite=Strict is affordable because the app and the API are served from
 * one origin; the CSRF token below is defence in depth for the cases SameSite
 * does not cover (old browsers, a future split origin).
 */
const baseCookie = (isProduction: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
});

export function setSessionCookies(
  response: Response,
  options: {
    token: string;
    csrfToken: string;
    maxAgeMs: number;
    isProduction: boolean;
  },
): void {
  response.cookie(SESSION_COOKIE, options.token, {
    ...baseCookie(options.isProduction),
    maxAge: options.maxAgeMs,
  });

  // Readable by the app on purpose: it has to echo the value back in a header
  // for the double-submit check.
  response.cookie(CSRF_COOKIE, options.csrfToken, {
    ...baseCookie(options.isProduction),
    httpOnly: false,
    maxAge: options.maxAgeMs,
  });
}

export function clearSessionCookies(
  response: Response,
  isProduction: boolean,
): void {
  response.clearCookie(SESSION_COOKIE, baseCookie(isProduction));
  response.clearCookie(CSRF_COOKIE, {
    ...baseCookie(isProduction),
    httpOnly: false,
  });
}
