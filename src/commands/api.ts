import { Command } from 'commander';
import { getActiveProfile } from '../lib/config.js';
import { createClient } from '../lib/client.js';
import { error, json } from '../lib/output.js';

async function apiCall(
  method: string,
  path: string,
  options: { data?: string; query?: string[] },
): Promise<void> {
  try {
    const profile = getActiveProfile();
    const client = createClient({
      baseUrl: process.env.PAPERCLIP_BASE_URL || profile.baseUrl,
      token: process.env.PAPERCLIP_TOKEN || profile.token,
    });

    const methodUpper = method.toUpperCase();

    // Parse query parameters
    let queryParams: Record<string, any> | undefined;
    if (options.query && options.query.length > 0) {
      queryParams = {};
      options.query.forEach((q) => {
        const [key, value] = q.split('=');
        if (key && value) {
          queryParams![key] = value;
        }
      });
    }

    // Parse request body
    let body: any;
    if (options.data) {
      try {
        body = JSON.parse(options.data);
      } catch {
        error('Invalid JSON in --data');
        process.exit(4);
      }
    }

    let response: Response;

    switch (methodUpper) {
      case 'GET': {
        const result = await client.get(path, queryParams);
        json(result);
        return;
      }
      case 'POST': {
        const result = await client.post(path, body);
        json(result);
        return;
      }
      case 'PATCH':
      case 'PUT': {
        const result = await client.patch(path, body);
        json(result);
        return;
      }
      case 'DELETE': {
        const result = await client.del(path);
        json(result);
        return;
      }
      default: {
        // For other methods, use rawFetch
        response = await client.rawFetch(path, {
          method: methodUpper,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          error(`HTTP ${response.status}: ${await response.text()}`);
          process.exit(1);
        }

        const result = await response.json();
        json(result);
        return;
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      error(err.message);
      if (err.message.includes('No active profile')) {
        process.exit(2);
      }
      if (err.message.includes('HTTP 401') || err.message.includes('HTTP 403')) {
        process.exit(2);
      }
      if (err.message.includes('HTTP 404')) {
        process.exit(3);
      }
    }
    process.exit(1);
  }
}

export function registerApiCommand(program: Command): void {
  program
    .command('api')
    .description('Make raw API calls with auto-auth')
    .argument('<method>', 'HTTP method (GET, POST, etc)')
    .argument('<path>', 'API path (e.g., /api/companies)')
    .option('--data <json>', 'Request body as JSON')
    .option('--query <key=value...>', 'Query parameters', [])
    .action(apiCall);
}
