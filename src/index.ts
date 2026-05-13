#!/usr/bin/env node

import { Command } from 'commander';
import { registerBridgeCommands } from './commands/bridge.js';
import { registerHermesCommands } from './commands/hermes.js';
import { registerApiCommand } from './commands/api.js';
import { registerOpenapiCommand } from './commands/openapi.js';
import { setJsonMode } from './lib/output.js';

const program = new Command();

program
  .name('paperclip')
  .description('Paperclip CLI for managing agents and infrastructure')
  .version('0.0.0')
  .option('--json', 'Output as JSON')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.json) {
      setJsonMode(true);
    }
  });

// Register Agent 3 commands
registerBridgeCommands(program);
registerHermesCommands(program);
registerApiCommand(program);
registerOpenapiCommand(program);

program.parse();
