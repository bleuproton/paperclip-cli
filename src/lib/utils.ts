import { homedir } from 'os';

/**
 * Expand ~ to home directory
 */
export function expandHomeDir(path: string): string {
  if (path.startsWith('~/')) {
    return path.replace('~', homedir());
  }
  return path;
}
