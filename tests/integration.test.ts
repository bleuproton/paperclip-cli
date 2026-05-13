import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '../src/lib/client.js';
import { loadConfig, saveConfig } from '../src/lib/config.js';
import type { Config } from '../src/lib/config.js';

describe('Integration Tests', () => {
  let mockFetch: typeof global.fetch;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;

    mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';

      if (url.includes('/api/companies/') && url.includes('/routines') && method === 'GET') {
        return new Response(JSON.stringify([
          { id: 'routine-1', name: 'test-routine', schedule: '0 9 * * *', status: 'active' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/companies/') && url.includes('/routines') && method === 'POST') {
        const body = JSON.parse(init?.body as string || '{}');
        return new Response(JSON.stringify({
          id: 'new-routine',
          name: body.name,
          schedule: body.schedule,
          status: 'active'
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/companies/') && url.includes('/secrets') && method === 'GET') {
        return new Response(JSON.stringify([
          { key: 'API_KEY', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/companies/') && url.includes('/secrets') && method === 'POST') {
        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.includes('/api/companies/') && url.includes('/costs/summary')) {
        return new Response(JSON.stringify({
          total: 45.23,
          totalRequests: 1245,
          items: [
            { provider: 'openai', totalCost: 30.50, requests: 800, avgCost: 0.038 },
            { provider: 'anthropic', totalCost: 14.73, requests: 445, avgCost: 0.033 }
          ]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/companies/') && url.includes('/approvals') && method === 'GET') {
        return new Response(JSON.stringify([
          { id: 'approval-1', type: 'agent-hire', requestedBy: 'CEO', status: 'pending', createdAt: '2024-01-01T00:00:00Z' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/approvals/') && url.includes('/approve')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.includes('/api/companies/') && url.includes('/plugins') && method === 'GET') {
        return new Response(JSON.stringify([
          { id: 'plugin-1', name: 'slack-notifications', enabled: true, version: '1.0.0' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/plugins/available')) {
        return new Response(JSON.stringify([
          { id: 'github-sync', name: 'GitHub Sync', version: '2.0.0', description: 'Sync with GitHub' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/companies/') && url.includes('/dashboard')) {
        return new Response(JSON.stringify({
          company: { id: '05e4fba7-f07d-4216-815c-08984486de5f', name: 'examplecorp' },
          metrics: { activeAgents: 3, openIssues: 12, completedThisWeek: 8 },
          activity: [
            { timestamp: '2024-01-01T10:00:00Z', description: 'Issue STO-42 created' }
          ]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/api/companies/') && url.includes('/issues')) {
        return new Response(JSON.stringify([
          { id: 'issue-1', identifier: 'STO-42', title: 'Test issue', status: 'in_progress' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.match(/\/api\/companies\/[^/]+$/)) {
        return new Response(JSON.stringify({
          id: '05e4fba7-f07d-4216-815c-08984486de5f',
          name: 'examplecorp',
          slug: 'examplecorp'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.match(/\/api\/companies\?/) || url.endsWith('/api/companies')) {
        return new Response(JSON.stringify([
          { id: '05e4fba7-f07d-4216-815c-08984486de5f', name: 'examplecorp', slug: 'examplecorp' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response('Not Found', { status: 404 });
    };

    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('Client', () => {
    it('should make GET requests', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const companies = await client.get('/api/companies');
      expect(companies).toHaveLength(1);
      expect(companies[0].slug).toBe('examplecorp');
    });

    it('should make POST requests', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const routine = await client.post('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/routines', {
        name: 'test-routine',
        schedule: '0 9 * * *'
      });

      expect(routine.name).toBe('test-routine');
    });
  });

  describe('Routines', () => {
    it('should list routines', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const routines = await client.get('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/routines');
      expect(routines).toHaveLength(1);
      expect(routines[0].name).toBe('test-routine');
    });

    it('should create routine', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const routine = await client.post('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/routines', {
        name: 'new-routine',
        schedule: '0 10 * * *'
      });

      expect(routine.id).toBe('new-routine');
    });
  });

  describe('Secrets', () => {
    it('should list secrets', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const secrets = await client.get('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/secrets');
      expect(secrets).toHaveLength(1);
      expect(secrets[0].key).toBe('API_KEY');
    });

    it('should set secret', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const result = await client.post('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/secrets', {
        key: 'NEW_KEY',
        value: 'secret-value'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Costs', () => {
    it('should get cost summary', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const summary = await client.get('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/costs/summary', {
        window: '7d'
      });

      expect(summary.total).toBe(45.23);
      expect(summary.items).toHaveLength(2);
    });
  });

  describe('Approvals', () => {
    it('should list approvals', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const approvals = await client.get('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/approvals', {
        status: 'pending'
      });

      expect(approvals).toHaveLength(1);
      expect(approvals[0].type).toBe('agent-hire');
    });

    it('should approve request', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const result = await client.post('/api/approvals/approval-1/approve', {
        comment: 'LGTM'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Plugins', () => {
    it('should list installed plugins', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const plugins = await client.get('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/plugins');
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('slack-notifications');
    });

    it('should list available plugins', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const plugins = await client.get('/api/plugins/available');
      expect(plugins).toHaveLength(1);
      expect(plugins[0].id).toBe('github-sync');
    });
  });

  describe('Dashboard', () => {
    it('should get dashboard data', async () => {
      const client = createClient({
        baseUrl: 'https://paperclip.examplecorp.com',
        token: 'test-token'
      });

      const dashboard = await client.get('/api/companies/05e4fba7-f07d-4216-815c-08984486de5f/dashboard');
      expect(dashboard.company.name).toBe('examplecorp');
      expect(dashboard.metrics.activeAgents).toBe(3);
    });
  });
});
