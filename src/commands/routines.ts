import { Command } from 'commander';
import { createClient } from '../lib/client.js';
import { getActiveProfile } from '../lib/config.js';
import { table, json, shouldUseJson, ok } from '../lib/output.js';

export function registerRoutinesCommands(program: Command): void {
  const routines = program
    .command('routines')
    .description('Manage routines and scheduled tasks');

  routines
    .command('ls')
    .description('List all routines for current company')
    .option('--active', 'Show only active routines')
    .action(async (opts) => {
      const profile = getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const routines = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/routines`, {
        active: opts.active ? true : undefined
      });

      if (shouldUseJson()) {
        json(routines);
      } else {
        table(routines, ['id', 'name', 'schedule', 'status', 'lastRun', 'nextRun']);
      }
    });

  routines
    .command('create')
    .description('Create a new routine')
    .requiredOption('--name <name>', 'Routine name')
    .requiredOption('--schedule <cron>', 'Cron schedule expression')
    .option('--action <action>', 'Action to execute')
    .option('--enabled', 'Enable routine immediately', true)
    .action(async (opts) => {
      const profile = getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const routine = await client.post(`/api/companies/${profile.currentCompanyId}/routines`, {
        name: opts.name,
        schedule: opts.schedule,
        action: opts.action,
        enabled: opts.enabled
      });

      if (shouldUseJson()) {
        json(routine);
      } else {
        ok(`Created routine ${routine.id}`);
      }
    });

  routines
    .command('run <id>')
    .description('Manually trigger a routine')
    .action(async (id) => {
      const profile = getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const result = await client.post(`/api/routines/${id}/run`);

      if (shouldUseJson()) {
        json(result);
      } else {
        ok(`Routine ${id} triggered successfully`);
      }
    });

  const triggers = routines
    .command('triggers')
    .description('Manage routine triggers');

  triggers
    .command('ls')
    .description('List all triggers')
    .option('--routine <id>', 'Filter by routine ID')
    .action(async (opts) => {
      const profile = getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const triggers = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/routine-triggers`, {
        routineId: opts.routine
      });

      if (shouldUseJson()) {
        json(triggers);
      } else {
        table(triggers, ['id', 'routineId', 'status', 'startedAt', 'completedAt']);
      }
    });
}
