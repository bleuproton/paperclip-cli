import { Command } from 'commander';
import { createClient } from '../lib/client.js';
import { getActiveProfile } from '../lib/config.js';
import { table, json, shouldUseJson, ok } from '../lib/output.js';

export function registerPluginsCommands(program: Command): void {
  const plugins = program
    .command('plugins')
    .description('Manage company plugins');

  plugins
    .command('ls')
    .description('List installed plugins')
    .option('--available', 'Show available plugins (not installed)')
    .action(async (opts) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const endpoint = opts.available ? '/api/plugins/available' : `/api/companies/${profile.currentCompanyId}/plugins`;
      const plugins = await client.get<any[]>(endpoint);

      if (shouldUseJson()) {
        json(plugins);
      } else {
        const columns = opts.available ?
          ['id', 'name', 'version', 'description'] :
          ['id', 'name', 'enabled', 'version', 'installedAt'];
        table(plugins, columns);
      }
    });

  plugins
    .command('install <name>')
    .description('Install a plugin')
    .option('--version <version>', 'Specific version to install')
    .action(async (name, opts) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const result = await client.post(`/api/companies/${profile.currentCompanyId}/plugins`, {
        name,
        version: opts.version
      });

      if (shouldUseJson()) {
        json(result);
      } else {
        ok(`Plugin ${name} installed successfully`);
      }
    });

  plugins
    .command('enable <id>')
    .description('Enable a plugin')
    .action(async (id) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      await client.post(`/api/plugins/${id}/enable`);

      ok(`Plugin ${id} enabled`);
    });

  plugins
    .command('disable <id>')
    .description('Disable a plugin')
    .action(async (id) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      await client.post(`/api/plugins/${id}/disable`);

      ok(`Plugin ${id} disabled`);
    });

  plugins
    .command('trigger <id>')
    .description('Manually trigger a plugin action')
    .option('--data <json>', 'JSON data to pass to plugin')
    .action(async (id, opts) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const data = opts.data ? JSON.parse(opts.data) : {};
      const result = await client.post(`/api/plugins/${id}/trigger`, data);

      if (shouldUseJson()) {
        json(result);
      } else {
        ok(`Plugin ${id} triggered successfully`);
      }
    });
}
