#!/usr/bin/env node

import { Command } from 'commander';
import { setJsonMode, setQuietMode, error } from './lib/output.js';
import { PaperclipError } from './lib/errors.js';
import { registerRoutinesCommands } from './commands/routines.js';
import { registerSecretsCommands } from './commands/secrets.js';
import { registerCostsCommands } from './commands/costs.js';
import { registerApprovalsCommands } from './commands/approvals.js';
import { registerPluginsCommands } from './commands/plugins.js';
import { registerDashboardCommand } from './commands/dashboard.js';

const program = new Command();

program
  .name('paperclip')
  .description('CLI for Paperclip + storminterview org-bridge + hermes')
  .version('0.1.0')
  .option('--json', 'Output as JSON')
  .option('--quiet', 'Minimal output (IDs only)')
  .option('--profile <name>', 'Use specific profile')
  .option('--company <id>', 'Override current company')
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.json) setJsonMode(true);
    if (opts.quiet) setQuietMode(true);
    if (opts.profile) process.env.PAPERCLIP_PROFILE = opts.profile;
    if (opts.company) {
      const { loadConfig, saveConfig } = await import('./lib/config.js');
      const config = loadConfig();
      const profile = config.profiles[config.currentProfile];
      if (profile) {
        profile.currentCompanyId = opts.company;
        saveConfig(config);
      }
    }
  });

registerRoutinesCommands(program);
registerSecretsCommands(program);
registerCostsCommands(program);
registerApprovalsCommands(program);
registerPluginsCommands(program);
registerDashboardCommand(program);

program.parse();

process.on('unhandledRejection', (err) => {
  if (err instanceof PaperclipError) {
    error(err.message);
    process.exit(err.exitCode);
  } else if (err instanceof Error) {
    error(err.message);
    process.exit(1);
  } else {
    error('An unknown error occurred');
    process.exit(1);
  }
});
