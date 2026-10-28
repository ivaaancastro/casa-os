export class VaultApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'VaultApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/** Fetch de la bóveda: JSON, cookies de sesión y sin caché. */
export async function vaultFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new VaultApiError(data.error ?? 'Error del servidor', response.status);
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof VaultApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error';
}
