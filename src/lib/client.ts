export interface PaperclipClient {
  get<T = any>(path: string, query?: Record<string, any>): Promise<T>;
  post<T = any>(path: string, body?: any): Promise<T>;
  patch<T = any>(path: string, body?: any): Promise<T>;
  del<T = any>(path: string): Promise<T>;
  rawFetch(path: string, init?: RequestInit): Promise<Response>;
}

export function createClient(opts: { baseUrl: string; token: string }): PaperclipClient {
  const { baseUrl, token } = opts;

  async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    };

    const response = await fetch(url, { ...init, headers });
    return response;
  }

  async function get<T = any>(path: string, query?: Record<string, any>): Promise<T> {
    let url = path;
    if (query) {
      const params = new URLSearchParams(
        Object.entries(query).map(([k, v]) => [k, String(v)])
      );
      url += `?${params}`;
    }
    const response = await rawFetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async function post<T = any>(path: string, body?: any): Promise<T> {
    const response = await rawFetch(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async function patch<T = any>(path: string, body?: any): Promise<T> {
    const response = await rawFetch(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async function del<T = any>(path: string): Promise<T> {
    const response = await rawFetch(path, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  return { get, post, patch, del, rawFetch };
}
