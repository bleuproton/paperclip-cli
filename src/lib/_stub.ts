// STUB implementations - Agent 1 will replace these with real implementations
// Agent 2 imports from here until Agent 1 delivers

import { homedir } from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// === CONFIG ===
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
  if (!existsSync(CONFIG_PATH)) {
    return {
      currentProfile: 'prod',
      profiles: {}
    };
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

export function saveConfig(c: Config): void {
  const dir = join(homedir(), '.paperclip');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o600 });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2), { mode: 0o600 });
}

export function getActiveProfile(): Profile {
  const config = loadConfig();
  const profile = config.profiles[config.currentProfile];
  if (!profile) {
    throw new Error(`No active profile found. Run 'paperclip login' first.`);
  }
  return profile;
}

export function setActiveProfile(name: string): void {
  const config = loadConfig();
  config.currentProfile = name;
  saveConfig(config);
}

// === CLIENT ===
export interface PaperclipClient {
  get<T = any>(path: string, query?: Record<string, any>): Promise<T>;
  post<T = any>(path: string, body?: any): Promise<T>;
  patch<T = any>(path: string, body?: any): Promise<T>;
  del<T = any>(path: string): Promise<T>;
  rawFetch(path: string, init?: RequestInit): Promise<Response>;
}

export function createClient(opts: { baseUrl: string; token: string }): PaperclipClient {
  const buildUrl = (path: string, query?: Record<string, any>) => {
    const url = new URL(path, opts.baseUrl);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    return url.toString();
  };

  const request = async <T>(path: string, init?: RequestInit, query?: Record<string, any>): Promise<T> => {
    const url = buildUrl(path, query);
    const headers = {
      'Authorization': `Bearer ${opts.token}`,
      'Content-Type': 'application/json',
      ...init?.headers
    };

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return response.json();
  };

  return {
    get: <T>(path: string, query?: Record<string, any>) => request<T>(path, { method: 'GET' }, query),
    post: <T>(path: string, body?: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body?: any) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    rawFetch: (path: string, init?: RequestInit) => fetch(buildUrl(path), {
      ...init,
      headers: { 'Authorization': `Bearer ${opts.token}`, ...init?.headers }
    })
  };
}

// === OUTPUT ===
export function shouldUseJson(): boolean {
  return process.argv.includes('--json') || !process.stdout.isTTY;
}

export function table(rows: Record<string, any>[], columns: string[]): void {
  if (shouldUseJson()) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (rows.length === 0) {
    console.log('No results');
    return;
  }

  const widths = columns.map(col =>
    Math.max(col.length, ...rows.map(r => String(r[col] || '').length))
  );

  const header = columns.map((col, i) => col.padEnd(widths[i])).join('  ');
  console.log(header);
  console.log('-'.repeat(header.length));

  rows.forEach(row => {
    const line = columns.map((col, i) => String(row[col] || '').padEnd(widths[i])).join('  ');
    console.log(line);
  });
}

export function json(data: any): void {
  if (process.stdout.isTTY) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(JSON.stringify(data));
  }
}

export function statusBadge(status: string): string {
  // Simplified colorization stub
  const colors: Record<string, string> = {
    backlog: '\x1b[90m',     // gray
    todo: '\x1b[36m',        // cyan
    in_progress: '\x1b[33m', // yellow
    in_review: '\x1b[35m',   // magenta
    done: '\x1b[32m',        // green
    blocked: '\x1b[31m',     // red
    cancelled: '\x1b[90m'    // gray
  };
  const reset = '\x1b[0m';
  const color = colors[status] || '';
  return `${color}${status}${reset}`;
}

export function ok(msg: string): void {
  console.log(`✓ ${msg}`);
}

export function warn(msg: string): void {
  console.warn(`⚠ ${msg}`);
}

export function error(msg: string): void {
  console.error(`✗ ${msg}`);
}

// === ERRORS ===
export class PaperclipError extends Error {
  constructor(public message: string, public exitCode: number = 1) {
    super(message);
    this.name = 'PaperclipError';
  }
}

export class AuthError extends PaperclipError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends PaperclipError {
  constructor(message: string) {
    super(message, 3);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends PaperclipError {
  constructor(message: string) {
    super(message, 4);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends PaperclipError {
  constructor(message: string) {
    super(message, 5);
    this.name = 'NetworkError';
  }
}

// === RESOLVER ===
interface IssueCache {
  companyId: string;
  timestamp: number;
  issues: Array<{ id: string; identifier: string }>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_DIR = join(homedir(), '.paperclip', '.cache');

function getCachedIssues(companyId: string): IssueCache | null {
  const cachePath = join(CACHE_DIR, `issues-${companyId}.json`);
  if (!existsSync(cachePath)) return null;

  const cached: IssueCache = JSON.parse(readFileSync(cachePath, 'utf-8'));
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    return null;
  }
  return cached;
}

function setCachedIssues(companyId: string, issues: Array<{ id: string; identifier: string }>): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  const cache: IssueCache = {
    companyId,
    timestamp: Date.now(),
    issues
  };
  writeFileSync(join(CACHE_DIR, `issues-${companyId}.json`), JSON.stringify(cache));
}

export async function resolveIssueId(
  identifier: string,
  client: PaperclipClient,
  companyId: string
): Promise<string> {
  // If it looks like a UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)) {
    return identifier;
  }

  // Check cache first
  const cached = getCachedIssues(companyId);
  if (cached) {
    const found = cached.issues.find(i => i.identifier === identifier);
    if (found) return found.id;
  }

  // Fetch from API
  const issues = await client.get<any[]>(`/api/companies/${companyId}/issues`, { limit: 200 });
  const mapped = issues.map(i => ({ id: i.id, identifier: i.identifier }));
  setCachedIssues(companyId, mapped);

  const found = mapped.find(i => i.identifier === identifier);
  if (!found) {
    throw new NotFoundError(`Issue ${identifier} not found`);
  }
  return found.id;
}

export async function resolveAgentId(
  nameOrId: string,
  client: PaperclipClient,
  companyId: string
): Promise<string> {
  // If it looks like a UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return nameOrId;
  }

  // Fetch agents and match by name
  const agents = await client.get<any[]>(`/api/companies/${companyId}/agents`);
  const found = agents.find(a => a.name === nameOrId);
  if (!found) {
    throw new NotFoundError(`Agent ${nameOrId} not found`);
  }
  return found.id;
}

export async function resolveCompanyId(
  slugOrId: string,
  client: PaperclipClient
): Promise<string> {
  // If it looks like a UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)) {
    return slugOrId;
  }

  // Fetch companies and match by slug
  const companies = await client.get<any[]>('/api/companies');
  const found = companies.find(c => c.slug === slugOrId);
  if (!found) {
    throw new NotFoundError(`Company ${slugOrId} not found`);
  }
  return found.id;
}
