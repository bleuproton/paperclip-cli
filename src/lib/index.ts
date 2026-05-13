import { resolveIssueIdentifier, resolveAgentName, resolveCompanySlug } from './resolver.js';
import { createClient } from './client.js';
import { getActiveProfile as _getActiveProfile, loadConfig as _loadConfig } from './config.js';

export { getActiveProfile, loadConfig, saveConfig, setActiveProfile } from './config.js';
export { createClient } from './client.js';
export { table, json, shouldUseJson, statusBadge, ok, warn, error } from './output.js';

// Convenience wrappers — auto-create client from active profile
export async function resolveIssueId(companyId: string, identifier: string): Promise<string> {
  const profile = await _getActiveProfile();
  const client = createClient(profile);
  return resolveIssueIdentifier(client, companyId, identifier);
}
export async function resolveAgentId(companyId: string, name: string): Promise<string> {
  const profile = await _getActiveProfile();
  const client = createClient(profile);
  return resolveAgentName(client, companyId, name);
}
export async function resolveCompanyId(slug: string): Promise<string> {
  const profile = await _getActiveProfile();
  const client = createClient(profile);
  return resolveCompanySlug(client, slug);
}
