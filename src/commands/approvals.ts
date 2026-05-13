import { Command } from 'commander';
import { createClient } from '../lib/client.js';
import { getActiveProfile } from '../lib/config.js';
import { table, json, shouldUseJson, ok } from '../lib/output.js';

export function registerApprovalsCommands(program: Command): void {
  const approvals = program
    .command('approvals')
    .description('Manage approval requests');

  approvals
    .command('ls')
    .description('List pending approvals')
    .option('--status <status>', 'Filter by status: pending, approved, rejected')
    .option('--limit <n>', 'Limit results', '20')
    .action(async (opts) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const approvals = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/approvals`, {
        status: opts.status || 'pending',
        limit: opts.limit
      });

      if (shouldUseJson()) {
        json(approvals);
      } else {
        table(approvals, ['id', 'type', 'requestedBy', 'status', 'createdAt']);
      }
    });

  approvals
    .command('approve <id>')
    .description('Approve a pending request')
    .option('--comment <text>', 'Add a comment')
    .action(async (id, opts) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      await client.post(`/api/approvals/${id}/approve`, {
        comment: opts.comment
      });

      ok(`Approval ${id} approved`);
    });

  approvals
    .command('reject <id>')
    .description('Reject a pending request')
    .option('--comment <text>', 'Add a comment')
    .action(async (id, opts) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      await client.post(`/api/approvals/${id}/reject`, {
        comment: opts.comment
      });

      ok(`Approval ${id} rejected`);
    });
}
