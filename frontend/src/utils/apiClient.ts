/**
 * Centralized HTTP client for the Open Arena frontend.
 *
 * - Sends credentials: 'include' for cookie-based JWT auth.
 * - Automatically retries on 401 after refreshing tokens.
 * - Parses JSON responses and error envelopes.
 * - One shared place to configure base URL, headers, and error handling.
 */
import type { ApiError } from '@open-arena/shared';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiError | string) {
    const message = typeof body === 'string' ? body : (body.error ?? `Request failed (${status})`);
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    if (typeof body !== 'string') {
      this.code = body.code;
      this.details = body.details;
    }
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skips the automatic 401 → refresh → retry flow. */
  skipAuthRetry?: boolean;
}

const BASE_URL = '/api';
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T = unknown>(
  method: string,
  path: string,
  options: RequestOptions = {},
  /** Internal: is this a retry after a 401 refresh? */
  isRetry = false,
): Promise<T> {
  const { body, skipAuthRetry, ...init } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 → refresh token and retry once
  if (res.status === 401 && !skipAuthRetry && !isRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request<T>(method, path, options, true);
    }
    // Refresh failed — caller should redirect to login
    throw new ApiRequestError(401, 'Session expired. Please log in again.');
  }

  // No content (204) or empty body
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as unknown as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) throw new ApiRequestError(res.status, text);
    return text as unknown as T;
  }

  const json = await res.json();
  if (!res.ok) {
    throw new ApiRequestError(res.status, json as ApiError);
  }

  return json as T;
}

/** Typed HTTP helpers. */

export function get<T = unknown>(path: string, options?: RequestOptions) {
  return request<T>('GET', path, options);
}

export function post<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>('POST', path, { ...options, body });
}

export function put<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>('PUT', path, { ...options, body });
}

export function patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>('PATCH', path, { ...options, body });
}

export function del<T = unknown>(path: string, options?: RequestOptions) {
  return request<T>('DELETE', path, options);
}
