import { mkdir, readFile, writeFile, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { AuthError } from './errors.js';

export interface Profile {
  baseUrl: string;
  token: string;
  tokenSource?: 'cli-auth' | 'api-key';
  userId?: string;
  currentCompanyId?: string;
}

export interface SshConfig {
  jumpHost: string;
  target: string;
  keyPath: string;
}

export interface Config {
  currentProfile: string;
  profiles: Record<string, Profile>;
  ssh?: SshConfig;
}

const CONFIG_DIR = join(homedir(), '.paperclip');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<Config> {
  if (!existsSync(CONFIG_PATH)) {
    return {
      currentProfile: 'prod',
      profiles: {},
    };
  }

  const content = await readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

export async function saveConfig(config: Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  await chmod(CONFIG_PATH, 0o600);
}

export async function getActiveProfile(): Promise<Profile> {
  const config = await loadConfig();
  const profileName = config.currentProfile;
  const profile = config.profiles[profileName];

  if (!profile) {
    throw new AuthError(`No profile found: ${profileName}`);
  }

  // Apply environment variable overrides
  return {
    ...profile,
    baseUrl: process.env.PAPERCLIP_BASE_URL || profile.baseUrl,
    token: process.env.PAPERCLIP_TOKEN || profile.token,
  };
}

export async function setActiveProfile(name: string): Promise<void> {
  const config = await loadConfig();

  if (!config.profiles[name]) {
    throw new AuthError(`Profile not found: ${name}`);
  }

  config.currentProfile = name;
  await saveConfig(config);
}
