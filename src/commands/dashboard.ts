import { Command } from 'commander';
import { createClient } from '../lib/client.js';
import { getActiveProfile } from '../lib/config.js';
import { json, shouldUseJson, statusBadge } from '../lib/output.js';
import kleur from 'kleur';

export function registerDashboardCommand(program: Command): void {
  program
    .command('dashboard')
    .description('Show company dashboard with metrics and activity')
    .action(async () => {
      const profile = await getActiveProfile();
      if (!profile.currentCompanyId) {
        throw new Error('No company selected. Run: paperclip companies use <id>');
      }

      const client = createClient(profile);

      const [dashboard, costs, issues] = await Promise.all([
        client.get(`/api/companies/${profile.currentCompanyId}/dashboard`),
        client.get(`/api/companies/${profile.currentCompanyId}/costs/summary`, { window: '7d' }),
        client.get<any[]>(`/api/companies/${profile.currentCompanyId}/issues`, { limit: 10 })
      ]);

      if (shouldUseJson()) {
        json({ dashboard, costs, issues });
        return;
      }

      console.log(kleur.bold().cyan('\n━━━ COMPANY DASHBOARD ━━━\n'));

      if (dashboard.company) {
        console.log(kleur.bold('Company:'), dashboard.company.name);
        console.log();
      }

      if (dashboard.metrics) {
        console.log(kleur.bold().underline('Metrics'));
        console.log(`  Active agents: ${dashboard.metrics.activeAgents || 0}`);
        console.log(`  Open issues: ${dashboard.metrics.openIssues || 0}`);
        console.log(`  Completed this week: ${dashboard.metrics.completedThisWeek || 0}`);
        console.log();
      }

      if (costs && costs.total !== undefined) {
        console.log(kleur.bold().underline('Costs (7d)'));
        console.log(`  Total: $${costs.total.toFixed(2)}`);
        console.log(`  Requests: ${costs.totalRequests || 0}`);
        console.log();
      }

      if (issues && issues.length > 0) {
        console.log(kleur.bold().underline('Recent Issues'));
        issues.slice(0, 5).forEach((issue: any) => {
          const badge = statusBadge(issue.status);
          console.log(`  ${badge} ${issue.identifier || issue.id.slice(0, 8)} - ${issue.title}`);
        });
        console.log();
      }

      if (dashboard.activity && dashboard.activity.length > 0) {
        console.log(kleur.bold().underline('Recent Activity'));
        dashboard.activity.slice(0, 5).forEach((item: any) => {
          console.log(`  ${kleur.dim(item.timestamp)} ${item.description}`);
        });
        console.log();
      }
    });
}
