import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, saveConfig, getActiveProfile, setActiveProfile, type Config } from '../src/lib/config.js';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_PATH = join(homedir(), '.paperclip', 'config.json');

describe('config', () => {
  let originalConfig: Config | null = null;

  beforeEach(async () => {
    // Backup existing config if it exists
    if (existsSync(CONFIG_PATH)) {
      originalConfig = await loadConfig();
    }
  });

  afterEach(async () => {
    // Restore original config
    if (originalConfig) {
      await saveConfig(originalConfig);
    } else if (existsSync(CONFIG_PATH)) {
      await unlink(CONFIG_PATH);
    }
  });

  it('should load empty config when file does not exist', async () => {
    if (existsSync(CONFIG_PATH)) {
      await unlink(CONFIG_PATH);
    }

    const config = await loadConfig();
    expect(config).toEqual({
      currentProfile: 'prod',
      profiles: {},
    });
  });

  it('should save and load config', async () => {
    const config: Config = {
      currentProfile: 'test',
      profiles: {
        test: {
          baseUrl: 'https://test.example.com',
          token: 'test-token',
          tokenSource: 'cli-auth',
          userId: 'user-123',
        },
      },
    };

    await saveConfig(config);
    const loaded = await loadConfig();

    expect(loaded).toEqual(config);
  });

  it('should get active profile', async () => {
    const config: Config = {
      currentProfile: 'prod',
      profiles: {
        prod: {
          baseUrl: 'https://prod.example.com',
          token: 'prod-token',
          userId: 'user-456',
        },
      },
    };

    await saveConfig(config);
    const profile = await getActiveProfile();

    expect(profile.baseUrl).toBe('https://prod.example.com');
    expect(profile.token).toBe('prod-token');
  });

  it('should apply environment variable overrides', async () => {
    const config: Config = {
      currentProfile: 'prod',
      profiles: {
        prod: {
          baseUrl: 'https://prod.example.com',
          token: 'prod-token',
        },
      },
    };

    await saveConfig(config);

    process.env.PAPERCLIP_BASE_URL = 'https://override.example.com';
    process.env.PAPERCLIP_TOKEN = 'override-token';

    const profile = await getActiveProfile();

    expect(profile.baseUrl).toBe('https://override.example.com');
    expect(profile.token).toBe('override-token');

    delete process.env.PAPERCLIP_BASE_URL;
    delete process.env.PAPERCLIP_TOKEN;
  });

  it('should switch active profile', async () => {
    const config: Config = {
      currentProfile: 'prod',
      profiles: {
        prod: {
          baseUrl: 'https://prod.example.com',
          token: 'prod-token',
        },
        dev: {
          baseUrl: 'https://dev.example.com',
          token: 'dev-token',
        },
      },
    };

    await saveConfig(config);
    await setActiveProfile('dev');

    const loaded = await loadConfig();
    expect(loaded.currentProfile).toBe('dev');
  });

  it('should throw error when profile not found', async () => {
    const config: Config = {
      currentProfile: 'nonexistent',
      profiles: {},
    };

    await saveConfig(config);

    await expect(getActiveProfile()).rejects.toThrow('No profile found');
  });
});
