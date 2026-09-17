/**
 * `catch (error)` gives `unknown` under strict mode, which is honest: a throw
 * can be anything. These narrow it in the one way the code actually cares
 * about, instead of each site asserting `error.message` and crashing when
 * something that is not an Error comes through.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

export function errorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}
