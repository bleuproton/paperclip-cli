import { Command } from 'commander';
import { performCliAuth } from '../lib/auth.js';
import { loadConfig, saveConfig, getActiveProfile } from '../lib/config.js';
import { createClient } from '../lib/client.js';
import { ok, json, shouldUseJson } from '../lib/output.js';

export function registerAuthCommands(program: Command): void {
  program
    .command('login')
    .description('Authenticate with Paperclip')
    .option('--instance <url>', 'Paperclip instance URL', 'https://paperclip.examplecorp.com')
    .action(async (opts) => {
      const baseUrl = opts.instance;
      const token = await performCliAuth(baseUrl);

      // Get user info
      const client = createClient({ baseUrl, token });
      const me = await client.get<{ id: string; name: string }>('/api/cli-auth/me');

      // Save profile
      const config = await loadConfig();
      const profileName = baseUrl.includes('localhost') ? 'local' : 'prod';

      config.profiles[profileName] = {
        baseUrl,
        token,
        tokenSource: 'cli-auth',
        userId: me.id,
      };

      if (!config.currentProfile || !config.profiles[config.currentProfile]) {
        config.currentProfile = profileName;
      }

      await saveConfig(config);

      if (shouldUseJson()) {
        json({ profile: profileName, userId: me.id, name: me.name });
      } else {
        ok(`Logged in as ${me.name} (profile: ${profileName})`);
      }
    });

  program
    .command('logout')
    .description('Revoke current authentication')
    .action(async () => {
      const profile = await getActiveProfile();
      const client = createClient(profile);

      await client.post('/api/cli-auth/revoke-current');

      // Remove profile from config
      const config = await loadConfig();
      delete config.profiles[config.currentProfile];

      // Switch to another profile if available
      const remainingProfiles = Object.keys(config.profiles);
      if (remainingProfiles.length > 0) {
        config.currentProfile = remainingProfiles[0];
      } else {
        config.currentProfile = 'prod';
      }

      await saveConfig(config);

      if (shouldUseJson()) {
        json({ status: 'logged_out' });
      } else {
        ok('Logged out');
      }
    });

  program
    .command('whoami')
    .description('Show current authentication status')
    .action(async () => {
      const profile = await getActiveProfile();
      const client = createClient(profile);

      const me = await client.get<{ id: string; name: string; email?: string }>(
        '/api/cli-auth/me'
      );

      const config = await loadConfig();

      if (shouldUseJson()) {
        json({
          userId: me.id,
          name: me.name,
          email: me.email,
          profile: config.currentProfile,
          baseUrl: profile.baseUrl,
        });
      } else {
        console.log(`User: ${me.name}`);
        console.log(`ID: ${me.id}`);
        if (me.email) {
          console.log(`Email: ${me.email}`);
        }
        console.log(`Profile: ${config.currentProfile}`);
        console.log(`Instance: ${profile.baseUrl}`);
      }
    });
}
