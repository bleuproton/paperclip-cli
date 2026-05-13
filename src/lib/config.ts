import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

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

const CONFIG_PATH = join(homedir(), '.paperclip', 'config.json');

export function loadConfig(): Config {
  try {
    const data = readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return {
      currentProfile: 'prod',
      profiles: {},
    };
  }
}

export function saveConfig(config: Config): void {
  const dir = dirname(CONFIG_PATH);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getActiveProfile(): Profile {
  const config = loadConfig();
  const profile = config.profiles[config.currentProfile];
  if (!profile) {
    throw new Error(`No active profile found: ${config.currentProfile}`);
  }
  return profile;
}

export function setActiveProfile(name: string): void {
  const config = loadConfig();
  if (!config.profiles[name]) {
    throw new Error(`Profile not found: ${name}`);
  }
  config.currentProfile = name;
  saveConfig(config);
}
