import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '../src/lib/client.js';

describe('api client', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('createClient', () => {
    it('should make GET request with auth header', async () => {
      const mockResponse = { data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      });

      const result = await client.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with query parameters', async () => {
      const mockResponse = { data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      });

      await client.get('/api/items', { status: 'active', limit: 10 });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/items?status=active&limit=10',
        expect.any(Object),
      );
    });

    it('should make POST request with body', async () => {
      const mockResponse = { id: '123' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      });

      const body = { title: 'Test Item' };
      const result = await client.post('/api/items', body);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make PATCH request', async () => {
      const mockResponse = { updated: true };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      });

      await client.patch('/api/items/123', { status: 'done' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/items/123',
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    it('should make DELETE request', async () => {
      const mockResponse = { deleted: true };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      });

      await client.del('/api/items/123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/items/123',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should throw error on non-OK response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      const client = createClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      });

      await expect(client.get('/api/missing')).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should use rawFetch for custom requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'custom' }),
      });

      const client = createClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      });

      const response = await client.rawFetch('/api/custom', {
        method: 'HEAD',
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/custom',
        expect.objectContaining({
          method: 'HEAD',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });
});
