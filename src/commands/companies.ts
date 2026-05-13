import { Command } from 'commander';
import {
  getActiveProfile,
  loadConfig,
  saveConfig,
  createClient,
  table,
  json,
  shouldUseJson,
  ok,
  error,
  resolveCompanyId
} from '../lib/index.js';

export function registerCompaniesCommands(program: Command): void {
  const companies = program
    .command('companies')
    .description('Manage companies');

  companies
    .command('ls')
    .description('List companies')
    .action(async () => {
      try {
        const profile = await getActiveProfile();
        const client = createClient(profile);
        const data = await client.get<any[]>('/api/companies');

        if (shouldUseJson()) {
          json(data);
        } else {
          const rows = data.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            current: c.id === profile.currentCompanyId ? '*' : ''
          }));
          table(rows, ['current', 'slug', 'name', 'id']);
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  companies
    .command('use')
    .description('Set current company')
    .argument('<slug-or-id>', 'Company slug or ID')
    .action(async (slugOrId: string) => {
      try {
        const profile = await getActiveProfile();
        const client = createClient(profile);
        const companyId = await resolveCompanyId(slugOrId);

        const config = await loadConfig();
        config.profiles[config.currentProfile].currentCompanyId = companyId;
        await saveConfig(config);

        ok(`Switched to company ${slugOrId}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}
