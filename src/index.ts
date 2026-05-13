#!/usr/bin/env node

import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerProfileCommands } from './commands/profile.js';
import { registerCompaniesCommands } from './commands/companies.js';
import { registerAgentsCommands } from './commands/agents.js';
import { registerIssuesCommands } from './commands/issues.js';
import { registerBridgeCommands } from './commands/bridge.js';
import { registerHermesCommands } from './commands/hermes.js';
import { registerApiCommand } from './commands/api.js';
import { registerOpenapiCommand } from './commands/openapi.js';
import { registerRoutinesCommands } from './commands/routines.js';
import { registerSecretsCommands } from './commands/secrets.js';
import { registerCostsCommands } from './commands/costs.js';
import { registerApprovalsCommands } from './commands/approvals.js';
import { registerPluginsCommands } from './commands/plugins.js';
import { registerDashboardCommand } from './commands/dashboard.js';
import { setJsonMode, error as outputError } from './lib/output.js';
import { PaperclipError } from './lib/errors.js';

const program = new Command();

program
  .name('paperclip')
  .description('CLI for Paperclip + storminterview org-bridge + hermes')
  .version('0.0.0')
  .option('--json', 'Output as JSON')
  .option('--profile <name>', 'Use specific profile')
  .option('--company <id>', 'Use specific company')
  .option('--quiet', 'Output IDs only')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    if (opts.json) setJsonMode(true);
  });

registerAuthCommands(program);
registerProfileCommands(program);
registerCompaniesCommands(program);
registerAgentsCommands(program);
registerIssuesCommands(program);
registerBridgeCommands(program);
registerHermesCommands(program);
registerApiCommand(program);
registerOpenapiCommand(program);
registerRoutinesCommands(program);
registerSecretsCommands(program);
registerCostsCommands(program);
registerApprovalsCommands(program);
registerPluginsCommands(program);
registerDashboardCommand(program);

try {
  await program.parseAsync(process.argv);
} catch (err: any) {
  if (err instanceof PaperclipError) { outputError(err.message); process.exit(err.exitCode); }
  outputError(err.message || 'Unknown error'); process.exit(1);
}
