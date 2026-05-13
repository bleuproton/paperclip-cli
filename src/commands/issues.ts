import { Command } from 'commander';
import {
  getActiveProfile,
  createClient,
  table,
  json,
  shouldUseJson,
  ok,
  error,
  statusBadge,
  resolveIssueId,
  resolveAgentId
} from '../lib/index.js';

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

function formatAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  return `${diffMins}m`;
}

export function registerIssuesCommands(program: Command): void {
  const issues = program
    .command('issues')
    .description('Manage issues');

  issues
    .command('ls')
    .description('List issues')
    .option('--status <status>', 'Filter by status')
    .option('--assignee <name>', 'Filter by assignee name (or "me")')
    .option('--limit <n>', 'Limit results', '20')
    .action(async (opts: { status?: string; assignee?: string; limit?: string }) => {
      try {
        const profile = getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const query: any = { limit: opts.limit };
        if (opts.status) query.status = opts.status;

        let data = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/issues`, query);

        // Filter by assignee if specified
        if (opts.assignee) {
          if (opts.assignee === 'me') {
            data = data.filter(i => i.assigneeAgent?.userId === profile.userId);
          } else {
            data = data.filter(i => i.assigneeAgent?.name === opts.assignee);
          }
        }

        if (shouldUseJson()) {
          json(data);
        } else {
          const rows = data.map(i => ({
            identifier: i.identifier,
            status: statusBadge(i.status),
            priority: i.priority || '',
            assignee: i.assigneeAgent?.name || '',
            title: truncate(i.title, 40),
            age: formatAge(i.createdAt)
          }));
          table(rows, ['identifier', 'status', 'priority', 'assignee', 'title', 'age']);
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  issues
    .command('create')
    .description('Create a new issue')
    .argument('<title>', 'Issue title')
    .option('--desc <text>', 'Issue description')
    .option('--priority <priority>', 'Priority (low|medium|high|critical)')
    .option('--assignee <name>', 'Assignee agent name')
    .action(async (title: string, opts: { desc?: string; priority?: string; assignee?: string }) => {
      try {
        const profile = getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const body: any = { title };
        if (opts.desc) body.description = opts.desc;
        if (opts.priority) body.priority = opts.priority;
        if (opts.assignee) {
          body.assigneeAgentId = await resolveAgentId(opts.assignee, client, profile.currentCompanyId);
        }

        const data = await client.post(`/api/companies/${profile.currentCompanyId}/issues`, body);
        ok(`Created issue ${data.identifier}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  issues
    .command('get')
    .description('Get issue details')
    .argument('<id>', 'Issue identifier (STO-N) or UUID')
    .action(async (id: string) => {
      try {
        const profile = getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const issueId = await resolveIssueId(id, client, profile.currentCompanyId);
        const data = await client.get(`/api/issues/${issueId}`);

        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  issues
    .command('edit')
    .description('Edit an issue')
    .argument('<id>', 'Issue identifier (STO-N) or UUID')
    .option('--status <status>', 'Status (backlog|todo|in_progress|in_review|done|blocked|cancelled)')
    .option('--assignee <name>', 'Assignee agent name')
    .option('--title <text>', 'New title')
    .action(async (id: string, opts: { status?: string; assignee?: string; title?: string }) => {
      try {
        const profile = getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const issueId = await resolveIssueId(id, client, profile.currentCompanyId);

        const body: any = {};
        if (opts.title) body.title = opts.title;
        if (opts.assignee) {
          body.assigneeAgentId = await resolveAgentId(opts.assignee, client, profile.currentCompanyId);
        }
        if (opts.status) {
          body.status = opts.status;

          // CRITICAL: Auto-attach assigneeAgentId when status=in_progress
          if (opts.status === 'in_progress' && !opts.assignee) {
            // Fetch current issue to check if it already has an assignee
            const current = await client.get<any>(`/api/issues/${issueId}`);
            if (!current.assigneeAgentId) {
              // Get CEO agent (first agent with role CEO or first agent in list)
              const agents = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/agents`);
              const ceo = agents.find(a => a.role === 'CEO') || agents[0];
              if (ceo) {
                body.assigneeAgentId = ceo.id;
              }
            }
          }

          // Set startedAt when moving to in_progress
          if (opts.status === 'in_progress') {
            body.startedAt = new Date().toISOString();
          }
        }

        const data = await client.patch(`/api/issues/${issueId}`, body);
        ok(`Updated issue ${id}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  issues
    .command('comment')
    .description('Add a comment to an issue')
    .argument('<id>', 'Issue identifier (STO-N) or UUID')
    .argument('<body>', 'Comment text')
    .action(async (id: string, body: string) => {
      try {
        const profile = getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const issueId = await resolveIssueId(id, client, profile.currentCompanyId);
        const data = await client.post(`/api/issues/${issueId}/comments`, { body });

        ok(`Added comment to issue ${id}`);
        json(data);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  issues
    .command('delete')
    .description('Delete an issue')
    .argument('<id>', 'Issue identifier (STO-N) or UUID')
    .action(async (id: string) => {
      try {
        const profile = getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const issueId = await resolveIssueId(id, client, profile.currentCompanyId);
        await client.del(`/api/issues/${issueId}`);

        ok(`Deleted issue ${id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  issues
    .command('watch')
    .description('Watch an issue for activity (polls every 5s)')
    .argument('<id>', 'Issue identifier (STO-N) or UUID')
    .action(async (id: string) => {
      try {
        const profile = getActiveProfile();
        if (!profile.currentCompanyId) {
          error('No company selected. Run: paperclip companies use <slug>');
          process.exit(1);
        }

        const client = createClient(profile);
        const issueId = await resolveIssueId(id, client, profile.currentCompanyId);

        let lastData: any = null;

        console.log(`Watching issue ${id}... (Ctrl+C to stop)`);

        const poll = async () => {
          const data = await client.get(`/api/issues/${issueId}`);

          if (!lastData) {
            console.log(`\n[${new Date().toISOString()}] Initial state:`);
            console.log(`  Status: ${data.status}`);
            console.log(`  Assignee: ${data.assigneeAgent?.name || 'none'}`);
            console.log(`  Comments: ${data.comments?.length || 0}`);
          } else {
            if (data.status !== lastData.status) {
              console.log(`\n[${new Date().toISOString()}] Status changed: ${lastData.status} -> ${data.status}`);
            }
            if (data.assigneeAgentId !== lastData.assigneeAgentId) {
              console.log(`\n[${new Date().toISOString()}] Assignee changed: ${lastData.assigneeAgent?.name || 'none'} -> ${data.assigneeAgent?.name || 'none'}`);
            }
            if ((data.comments?.length || 0) > (lastData.comments?.length || 0)) {
              const newComments = data.comments.slice(lastData.comments?.length || 0);
              newComments.forEach((c: any) => {
                console.log(`\n[${new Date().toISOString()}] New comment by ${c.author?.name || 'unknown'}:`);
                console.log(`  ${c.body}`);
              });
            }
          }

          lastData = data;
        };

        await poll();
        setInterval(poll, 5000);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}
