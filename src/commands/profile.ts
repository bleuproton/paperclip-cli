import { Command } from 'commander';
import { loadConfig, setActiveProfile } from '../lib/config.js';
import { ok, table, json, shouldUseJson } from '../lib/output.js';

export function registerProfileCommands(program: Command): void {
  const profiles = program.command('profiles').description('Manage profiles');

  profiles
    .command('ls')
    .description('List all profiles')
    .action(async () => {
      const config = await loadConfig();

      if (shouldUseJson()) {
        json({
          current: config.currentProfile,
          profiles: Object.entries(config.profiles).map(([name, profile]) => ({
            name,
            baseUrl: profile.baseUrl,
            tokenSource: profile.tokenSource,
            userId: profile.userId,
            currentCompanyId: profile.currentCompanyId,
          })),
        });
      } else {
        const rows = Object.entries(config.profiles).map(([name, profile]) => ({
          name: name === config.currentProfile ? `${name} *` : name,
          baseUrl: profile.baseUrl,
          tokenSource: profile.tokenSource || '-',
          userId: profile.userId || '-',
        }));

        if (rows.length === 0) {
          console.log('No profiles configured. Run `paperclip login` to get started.');
        } else {
          table(rows, ['name', 'baseUrl', 'tokenSource', 'userId']);
        }
      }
    });

  program
    .command('use')
    .description('Switch to a different profile')
    .argument('<profile>', 'Profile name')
    .action(async (profileName: string) => {
      await setActiveProfile(profileName);

      if (shouldUseJson()) {
        json({ profile: profileName });
      } else {
        ok(`Switched to profile: ${profileName}`);
      }
    });
}
