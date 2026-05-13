import { Command } from 'commander';
import { createClient } from '../lib/client.js';
import { getActiveProfile } from '../lib/config.js';
import { table, json, shouldUseJson, ok } from '../lib/output.js';
import { readFileSync } from 'fs';
import { stdin } from 'process';

export function registerSecretsCommands(program: Command): void {
  const secrets = program
    .command('secrets')
    .description('Manage secrets for current company');

  secrets
    .command('ls')
    .description('List all secret keys (values hidden)')
    .action(async () => {
      const profile = getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const secrets = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/secrets`);

      if (shouldUseJson()) {
        json(secrets);
      } else {
        table(secrets, ['key', 'createdAt', 'updatedAt', 'rotatedAt']);
      }
    });

  secrets
    .command('set <key> [value]')
    .description('Set a secret value (reads from stdin if value not provided)')
    .option('--file <path>', 'Read value from file (prefix with @)')
    .action(async (key, value, opts) => {
      const profile = getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      let secretValue = value;

      if (opts.file || (value && value.startsWith('@'))) {
        const filePath = opts.file || value.slice(1);
        secretValue = readFileSync(filePath, 'utf-8').trim();
      } else if (!value) {
        const chunks: Buffer[] = [];
        for await (const chunk of stdin) {
          chunks.push(chunk as Buffer);
        }
        secretValue = Buffer.concat(chunks).toString('utf-8').trim();
      }

      const client = createClient(profile);
      await client.post(`/api/companies/${profile.currentCompanyId}/secrets`, {
        key,
        value: secretValue
      });

      ok(`Secret ${key} set successfully`);
    });

  secrets
    .command('rotate <key>')
    .description('Rotate a secret (generates new value)')
    .action(async (key) => {
      const profile = getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const result = await client.post(`/api/companies/${profile.currentCompanyId}/secrets/${key}/rotate`);

      if (shouldUseJson()) {
        json(result);
      } else {
        ok(`Secret ${key} rotated successfully`);
      }
    });
}
