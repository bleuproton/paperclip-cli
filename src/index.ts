#!/usr/bin/env node

import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerProfileCommands } from './commands/profile.js';
import { setJsonMode, error as outputError } from './lib/output.js';
import { PaperclipError } from './lib/errors.js';

const program = new Command();

program
  .name('paperclip')
  .description('CLI for Paperclip project management')
  .version('0.0.0')
  .option('--json', 'Output as JSON')
  .option('--profile <name>', 'Use specific profile')
  .option('--company <id>', 'Use specific company')
  .option('--quiet', 'Output IDs only')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    if (opts.json) {
      setJsonMode(true);
    }
  });

// Register commands
registerAuthCommands(program);
registerProfileCommands(program);

// Error handling
async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof PaperclipError) {
      outputError(err.message);
      process.exit(err.exitCode);
    } else if (err instanceof Error) {
      outputError(err.message);
      process.exit(1);
    } else {
      outputError('Unknown error occurred');
      process.exit(1);
    }
  }
}

main();
