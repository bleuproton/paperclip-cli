import fs from 'fs';
import path from 'path';
import os from 'os';

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

const CONFIG_DIR = path.join(os.homedir(), '.paperclip');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    return {
      currentProfile: 'prod',
      profiles: {}
    };
  }
  const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(data);
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getActiveProfile(): Profile {
  const config = loadConfig();
  const profileName = process.env.PAPERCLIP_PROFILE || config.currentProfile;
  const profile = config.profiles[profileName];
  if (!profile) {
    throw new Error(`Profile '${profileName}' not found`);
  }

  return {
    ...profile,
    baseUrl: process.env.PAPERCLIP_BASE_URL || profile.baseUrl,
    token: process.env.PAPERCLIP_TOKEN || profile.token
  };
}

export function setActiveProfile(name: string): void {
  const config = loadConfig();
  if (!config.profiles[name]) {
    throw new Error(`Profile '${name}' does not exist`);
  }
  config.currentProfile = name;
  saveConfig(config);
}
