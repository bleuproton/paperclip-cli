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

  async function fetchWithRetry(
    url: string,
    init: RequestInit,
    retries = 2
  ): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, init);

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return response;
        }

        // Retry on 429 (rate limit) and 5xx errors
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw new NetworkError(lastError?.message || 'Network request failed');
  }

  async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = text;

      try {
        const json = JSON.parse(text);
        errorMessage = json.error || json.message || text;
      } catch {
        // Use text as-is
      }

      switch (response.status) {
        case 401:
        case 403:
          throw new AuthError(errorMessage);
        case 404:
          throw new NotFoundError(errorMessage);
        case 400:
        case 422:
          throw new ValidationError(errorMessage);
        default:
          throw new NetworkError(`HTTP ${response.status}: ${errorMessage}`);
      }
    }

    const text = await response.text();
    if (!text) return {} as T;

    try {
      return JSON.parse(text);
    } catch {
      return text as T;
    }
  }

  function buildUrl(path: string, query?: Record<string, any>): string {
    const url = new URL(path, baseUrl);
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
    async rawFetch(path: string, init?: RequestInit): Promise<Response> {
      const url = buildUrl(path);
      return fetchWithRetry(url, {
        ...init,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    },

    async get<T = any>(path: string, query?: Record<string, any>): Promise<T> {
      const url = buildUrl(path, query);
      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return handleResponse<T>(response);
    },

    async post<T = any>(path: string, body?: any): Promise<T> {
      const url = buildUrl(path);
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    },

    async patch<T = any>(path: string, body?: any): Promise<T> {
      const url = buildUrl(path);
      const response = await fetchWithRetry(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    },

    async del<T = any>(path: string): Promise<T> {
      const url = buildUrl(path);
      const response = await fetchWithRetry(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return handleResponse<T>(response);
    },
  };
}
