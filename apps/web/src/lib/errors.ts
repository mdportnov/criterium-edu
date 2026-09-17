import { isAxiosError } from 'axios';

/*
 * Every screen was doing `catch (err: any)` and then reaching into
 * `err.response.data.message`, which is both an eslint error and a runtime hazard —
 * a thrown string or a network failure has no `.response`. This narrows properly and
 * always returns something an error state can show the user.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const message = data?.message;
    if (Array.isArray(message) && message.length > 0) return message.join('. ');
    if (typeof message === 'string' && message.trim()) return message;
    if (!error.response) return 'The server did not respond. Check your connection.';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
