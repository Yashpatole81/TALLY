/**
 * Postgres SQLSTATE classes 22 (data exception) and 23 (integrity constraint violation) concern
 * one specific row. Anything else (network failure, auth, 5xx) affects the whole sync run.
 */
export function isRowSpecificError(error: { code?: unknown } | null | undefined): boolean {
  return typeof error?.code === 'string' && /^2[23][0-9A-Z]{3}$/.test(error.code);
}
