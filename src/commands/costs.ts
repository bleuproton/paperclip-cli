import { Command } from 'commander';
import { createClient } from '../lib/client.js';
import { getActiveProfile } from '../lib/config.js';
import { table, json, shouldUseJson } from '../lib/output.js';

export function registerCostsCommands(program: Command): void {
  const costs = program
    .command('costs')
    .description('View cost analytics');

  costs
    .command('summary')
    .description('Show cost summary')
    .option('--by <grouping>', 'Group by: agent, project, or provider', 'provider')
    .option('--since <window>', 'Time window (e.g., 7d, 30d, 24h)', '7d')
    .action(async (opts) => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);
      const summary = await client.get(`/api/companies/${profile.currentCompanyId}/costs/summary`, {
        window: opts.since,
        groupBy: opts.by
      });

      if (shouldUseJson()) {
        json(summary);
      } else {
        if (summary.items && Array.isArray(summary.items)) {
          const columns = opts.by === 'agent' ? ['agentName', 'totalCost', 'requests', 'avgCost'] :
                         opts.by === 'project' ? ['projectName', 'totalCost', 'requests', 'avgCost'] :
                         ['provider', 'totalCost', 'requests', 'avgCost'];

          table(summary.items, columns);

          console.log();
          console.log(`Total: $${summary.total || 0}`);
          console.log(`Period: ${opts.since}`);
        } else {
          json(summary);
        }
      }
    });
}
