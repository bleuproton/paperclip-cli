import { Command } from 'commander';
import {
  getActiveProfile,
  createClient,
  table,
  json,
  shouldUseJson,
  ok,
  error,
  resolveAgentId
} from '../lib/index.js';

export function registerAgentsCommands(program: Command): void {
  const agents = program
    .command('agents')
    .description('Manage agents');

  agents
    .command('ls')
    .description('List agents')
    .action(async () => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const data = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/agents`);

        if (shouldUseJson()) {
          json(data);
        } else {
          const rows = data.map(a => ({
            id: a.id,
            name: a.name,
            role: a.role,
            status: a.status,
            reportsTo: a.reportsToAgent?.name || ''
          }));
          table(rows, ['name', 'role', 'status', 'reportsTo', 'id']);
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  agents
    .command('get')
    .description('Get agent details')
    .argument('<id-or-name>', 'Agent ID or name')
    .action(async (idOrName: string) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const agentId = await resolveAgentId(idOrName, client, profile.currentCompanyId);
        const data = await client.get(`/api/agents/${agentId}`);

        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  agents
    .command('hire')
    .description('Hire a new agent')
    .requiredOption('--role <role>', 'Agent role')
    .option('--name <name>', 'Agent name')
    .option('--reports-to <id>', 'Reports to agent ID')
    .action(async (opts: { role: string; name?: string; reportsTo?: string }) => {
      try {
        const profile = await getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const body: any = { role: opts.role };
        if (opts.name) body.name = opts.name;
        if (opts.reportsTo) body.reportsToAgentId = opts.reportsTo;

        const data = await client.post(`/api/companies/${profile.currentCompanyId}/agent-hires`, body);
        ok(`Hired agent ${data.name || data.id}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  agents
    .command('pause')
    .description('Pause an agent')
    .argument('<id>', 'Agent ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        const client = createClient(profile);
        await client.post(`/api/agents/${id}/pause`);
        ok(`Paused agent ${id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  agents
    .command('resume')
    .description('Resume an agent')
    .argument('<id>', 'Agent ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        const client = createClient(profile);
        await client.post(`/api/agents/${id}/resume`);
        ok(`Resumed agent ${id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  agents
    .command('wakeup')
    .description('Wake up an agent')
    .argument('<id>', 'Agent ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        const client = createClient(profile);
        await client.post(`/api/agents/${id}/wakeup`);
        ok(`Woke up agent ${id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  agents
    .command('terminate')
    .description('Terminate an agent')
    .argument('<id>', 'Agent ID')
    .action(async (id: string) => {
      try {
        const profile = await getActiveProfile();
        const client = createClient(profile);
        await client.post(`/api/agents/${id}/terminate`);
        ok(`Terminated agent ${id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}
