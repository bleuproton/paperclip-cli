import { Command } from 'commander';
import {
  getActiveProfile,
  createClient,
  table,
  json,
  shouldUseJson,
  ok,
  error
} from '../lib/index.js';

export function registerGoalsCommands(program: Command): void {
  const goals = program
    .command('goals')
    .description('Manage goals');

  goals
    .command('ls')
    .description('List goals')
    .action(async () => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const data = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/goals`);

        if (shouldUseJson()) {
          json(data);
        } else {
          const rows = data.map(g => ({
            id: g.id,
            title: g.title,
            status: g.status || 'active',
            progress: g.progress ? `${g.progress}%` : '0%'
          }));
          table(rows, ['id', 'title', 'status', 'progress']);
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  goals
    .command('get')
    .description('Get goal details')
    .argument('<id>', 'Goal ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const data = await client.get(`/api/companies/${profile.currentCompanyId}/goals/${id}`);

        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  goals
    .command('create')
    .description('Create a new goal')
    .argument('<title>', 'Goal title')
    .option('--desc <text>', 'Goal description')
    .option('--target <date>', 'Target completion date')
    .action(async (title: string, opts: { desc?: string; target?: string }) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const body: any = { title };
        if (opts.desc) body.description = opts.desc;
        if (opts.target) body.targetDate = opts.target;

        const data = await client.post(`/api/companies/${profile.currentCompanyId}/goals`, body);
        ok(`Created goal ${data.id}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  goals
    .command('edit')
    .description('Edit a goal')
    .argument('<id>', 'Goal ID')
    .option('--title <text>', 'New title')
    .option('--desc <text>', 'New description')
    .option('--status <status>', 'Status (active|completed|cancelled)')
    .option('--progress <n>', 'Progress percentage (0-100)')
    .action(async (id: string, opts: { title?: string; desc?: string; status?: string; progress?: string }) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const body: any = {};
        if (opts.title) body.title = opts.title;
        if (opts.desc) body.description = opts.desc;
        if (opts.status) body.status = opts.status;
        if (opts.progress) body.progress = parseInt(opts.progress, 10);

        const data = await client.patch(`/api/companies/${profile.currentCompanyId}/goals/${id}`, body);
        ok(`Updated goal ${id}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  goals
    .command('delete')
    .description('Delete a goal')
    .argument('<id>', 'Goal ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        await client.del(`/api/companies/${profile.currentCompanyId}/goals/${id}`);

        ok(`Deleted goal ${id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}
