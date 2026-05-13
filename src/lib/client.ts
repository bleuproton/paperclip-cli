import { AuthError, NetworkError, NotFoundError, ValidationError } from './errors.js';

export interface PaperclipClient {
  get<T = any>(path: string, query?: Record<string, any>): Promise<T>;
  post<T = any>(path: string, body?: any): Promise<T>;
  patch<T = any>(path: string, body?: any): Promise<T>;
  del<T = any>(path: string): Promise<T>;
  rawFetch(path: string, init?: RequestInit): Promise<Response>;
}

export function createClient(opts: { baseUrl: string; token: string }): PaperclipClient {
  const { baseUrl, token } = opts;

  async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
    try {
      const response = await fetch(url, init);

      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
        return fetchWithRetry(url, init, retries - 1);
      }

      return response;
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchWithRetry(url, init, retries - 1);
      }
      throw new NetworkError(`Network request failed: ${err}`);
    }
  }

  async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401 || response.status === 403) {
      throw new AuthError('Authentication failed');
    }
    if (response.status === 404) {
      throw new NotFoundError('Resource not found');
    }
    if (response.status === 400 || response.status === 422) {
      const error = await response.json().catch(() => ({ message: 'Validation failed' }));
      throw new ValidationError(error.message || 'Validation failed');
    }
    if (!response.ok) {
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  function buildUrl(path: string, query?: Record<string, any>): string {
    const url = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  return {
    async get<T>(path: string, query?: Record<string, any>): Promise<T> {
      const response = await fetchWithRetry(buildUrl(path, query), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return handleResponse<T>(response);
    },

    async post<T>(path: string, body?: any): Promise<T> {
      const response = await fetchWithRetry(buildUrl(path), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    },

    async patch<T>(path: string, body?: any): Promise<T> {
      const response = await fetchWithRetry(buildUrl(path), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    },

    async del<T>(path: string): Promise<T> {
      const response = await fetchWithRetry(buildUrl(path), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return handleResponse<T>(response);
    },

    async rawFetch(path: string, init?: RequestInit): Promise<Response> {
      return fetchWithRetry(buildUrl(path), {
        ...init,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...init?.headers,
        },
      });
    },
  };
}
