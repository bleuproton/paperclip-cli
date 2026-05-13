#!/usr/bin/env node

import { Command } from 'commander';
import { registerCompaniesCommands } from './commands/companies.js';
import { registerAgentsCommands } from './commands/agents.js';
import { registerIssuesCommands } from './commands/issues.js';

const program = new Command();

program
  .name('paperclip')
  .description('CLI for Paperclip + storminterview org-bridge + hermes')
  .version('0.0.0');

// Global options
program.option('--json', 'Output JSON');
program.option('--profile <name>', 'Use specific profile');
program.option('--company <slug>', 'Override current company');
program.option('--quiet', 'IDs only');

// Register command groups
registerCompaniesCommands(program);
registerAgentsCommands(program);
registerIssuesCommands(program);

program.parse();
