import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { PaperclipClient } from './client.js';
import { NotFoundError } from './errors.js';

const CACHE_DIR = join(homedir(), '.paperclip', '.cache');
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface Issue {
  id: string;
  identifier: string;
  title: string;
}

interface Company {
  id: string;
  slug: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export async function resolveIssueIdentifier(
  client: PaperclipClient,
  companyId: string,
  identifier: string
): Promise<string> {
  // If already a UUID, return as-is
  if (isUuid(identifier)) {
    return identifier;
  }

  // Try to get from cache
  const cached = await getCache<Issue[]>(`issues-${companyId}`);
  if (cached) {
    const issue = cached.find(i => i.identifier === identifier);
    if (issue) {
      return issue.id;
    }
  }

  // Fetch fresh data
  const issues = await client.get<Issue[]>(`/api/companies/${companyId}/issues`, {
    limit: 200,
  });

  // Cache the results
  await setCache(`issues-${companyId}`, issues);

  const issue = issues.find(i => i.identifier === identifier);
  if (!issue) {
    throw new NotFoundError(`Issue not found: ${identifier}`);
  }

  return issue.id;
}

export async function resolveCompanySlug(
  client: PaperclipClient,
  slug: string
): Promise<string> {
  // If already a UUID, return as-is
  if (isUuid(slug)) {
    return slug;
  }

  // Fetch companies
  const companies = await client.get<Company[]>('/api/companies');

  const company = companies.find(c => c.slug === slug);
  if (!company) {
    throw new NotFoundError(`Company not found: ${slug}`);
  }

  return company.id;
}

export async function resolveAgentName(
  client: PaperclipClient,
  companyId: string,
  name: string
): Promise<string> {
  // If already a UUID, return as-is
  if (isUuid(name)) {
    return name;
  }

  // Special case: "me" resolves to current user's agent
  if (name === 'me') {
    const inbox = await client.get<{ agentId: string }>('/api/agents/me/inbox-lite');
    return inbox.agentId;
  }

  // Fetch agents
  const agents = await client.get<Agent[]>(`/api/companies/${companyId}/agents`);

  const agent = agents.find(a => a.name.toLowerCase() === name.toLowerCase());
  if (!agent) {
    throw new NotFoundError(`Agent not found: ${name}`);
  }

  return agent.id;
}

function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

async function getCache<T>(key: string): Promise<T | null> {
  const cachePath = join(CACHE_DIR, `${key}.json`);

  if (!existsSync(cachePath)) {
    return null;
  }

  try {
    const content = await readFile(cachePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(content);

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });

  const cachePath = join(CACHE_DIR, `${key}.json`);
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  await writeFile(cachePath, JSON.stringify(entry), 'utf-8');
}
