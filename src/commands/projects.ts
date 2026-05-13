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

export function registerProjectsCommands(program: Command): void {
  const projects = program
    .command('projects')
    .description('Manage projects');

  projects
    .command('ls')
    .description('List projects')
    .action(async () => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const data = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/projects`);

        if (shouldUseJson()) {
          json(data);
        } else {
          const rows = data.map(p => ({
            id: p.id,
            name: p.name,
            status: p.status || 'active',
            description: p.description ? p.description.substring(0, 50) : ''
          }));
          table(rows, ['id', 'name', 'status', 'description']);
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  projects
    .command('get')
    .description('Get project details')
    .argument('<id>', 'Project ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const data = await client.get(`/api/companies/${profile.currentCompanyId}/projects/${id}`);

        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  projects
    .command('create')
    .description('Create a new project')
    .argument('<name>', 'Project name')
    .option('--desc <text>', 'Project description')
    .option('--goal <id>', 'Associated goal ID')
    .action(async (name: string, opts: { desc?: string; goal?: string }) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const body: any = { name };
        if (opts.desc) body.description = opts.desc;
        if (opts.goal) body.goalId = opts.goal;

        const data = await client.post(`/api/companies/${profile.currentCompanyId}/projects`, body);
        ok(`Created project ${data.id}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  projects
    .command('edit')
    .description('Edit a project')
    .argument('<id>', 'Project ID')
    .option('--name <text>', 'New name')
    .option('--desc <text>', 'New description')
    .option('--status <status>', 'Status (active|completed|archived)')
    .action(async (id: string, opts: { name?: string; desc?: string; status?: string }) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const body: any = {};
        if (opts.name) body.name = opts.name;
        if (opts.desc) body.description = opts.desc;
        if (opts.status) body.status = opts.status;

        const data = await client.patch(`/api/companies/${profile.currentCompanyId}/projects/${id}`, body);
        ok(`Updated project ${id}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  projects
    .command('delete')
    .description('Delete a project')
    .argument('<id>', 'Project ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        await client.del(`/api/companies/${profile.currentCompanyId}/projects/${id}`);

        ok(`Deleted project ${id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}
