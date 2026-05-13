import { Command } from 'commander';
import { getActiveProfile } from '../lib/config.js';
import { createClient } from '../lib/client.js';
import { ok, error, json } from '../lib/output.js';
import { writeFileSync } from 'fs';

async function fetchOpenApi(options: { save?: string }): Promise<void> {
  try {
    const profile = getActiveProfile();
    const client = createClient({
      baseUrl: process.env.PAPERCLIP_BASE_URL || profile.baseUrl,
      token: process.env.PAPERCLIP_TOKEN || profile.token,
    });

    let spec: any;

    // Try to fetch from /api/openapi.json
    try {
      spec = await client.get('/api/openapi.json');
    } catch {
      // Fallback to introspection (if available)
      try {
        spec = await client.get('/api/introspection');
      } catch {
        error('OpenAPI spec not available at /api/openapi.json or /api/introspection');
        process.exit(3);
      }
    }

    if (options.save) {
      writeFileSync(options.save, JSON.stringify(spec, null, 2));
      ok(`OpenAPI spec saved to ${options.save}`);
    } else {
      json(spec);
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
    }
    process.exit(1);
  }
}

export function registerOpenapiCommand(program: Command): void {
  program
    .command('openapi')
    .description('Fetch OpenAPI specification')
    .option('--save <file>', 'Save spec to file')
    .action(fetchOpenApi);
}
