import { createClient, PaperclipClient } from './client.js';
import { getActiveProfile } from './config.js';
import { NotFoundError } from './errors.js';

export async function resolveIssueId(identifier: string, companyId: string): Promise<string> {
  if (!identifier.startsWith('STO-')) {
    return identifier;
  }

  const profile = getActiveProfile();
  const client = createClient(profile);

  const issues = await client.get<any[]>(`/api/companies/${companyId}/issues`, { limit: 200 });
  const issue = issues.find((i: any) => i.identifier === identifier);

  if (!issue) {
    throw new NotFoundError(`Issue ${identifier} not found`);
  }

  return issue.id;
}

export async function resolveAgentId(nameOrId: string, companyId: string): Promise<string> {
  if (nameOrId.match(/^[a-f0-9-]{36}$/)) {
    return nameOrId;
  }

  const profile = getActiveProfile();
  const client = createClient(profile);

  const agents = await client.get<any[]>(`/api/companies/${companyId}/agents`);
  const agent = agents.find((a: any) =>
    a.name?.toLowerCase() === nameOrId.toLowerCase() ||
    a.role?.toLowerCase() === nameOrId.toLowerCase()
  );

  if (!agent) {
    throw new NotFoundError(`Agent ${nameOrId} not found`);
  }

  return agent.id;
}

export async function resolveCompanyId(slugOrId: string): Promise<string> {
  if (slugOrId.match(/^[a-f0-9-]{36}$/)) {
    return slugOrId;
  }

  const profile = getActiveProfile();
  const client = createClient(profile);

  const companies = await client.get<any[]>('/api/companies');
  const company = companies.find((c: any) => c.slug === slugOrId || c.name === slugOrId);

  if (!company) {
    throw new NotFoundError(`Company ${slugOrId} not found`);
  }

  return company.id;
}
