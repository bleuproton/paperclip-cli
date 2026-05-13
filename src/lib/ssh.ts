import { spawn } from 'child_process';
import { expandHomeDir } from './utils.js';

export interface SshResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface SshConfig {
  jumpHost: string;
  target: string;
  keyPath: string;
}

/**
 * Execute command on remote host via SSH with jump host
 */
export async function sshExec(
  config: SshConfig,
  command: string,
): Promise<SshResult> {
  const keyPath = expandHomeDir(config.keyPath);

  const args = [
    '-i', keyPath,
    '-o', `ProxyCommand=ssh -i ${keyPath} -W %h:%p ${config.jumpHost}`,
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'IdentitiesOnly=yes',
    config.target,
    command,
  ];

  return new Promise((resolve) => {
    const proc = spawn('ssh', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: code ?? 1,
      });
    });
  });
}

/**
 * Stream command output over SSH (for logs with --follow)
 */
export function sshStream(
  config: SshConfig,
  command: string,
  onData: (line: string) => void,
  onError?: (err: string) => void,
): () => void {
  const keyPath = expandHomeDir(config.keyPath);

  const args = [
    '-i', keyPath,
    '-o', `ProxyCommand=ssh -i ${keyPath} -W %h:%p ${config.jumpHost}`,
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'IdentitiesOnly=yes',
    config.target,
    command,
  ];

  const proc = spawn('ssh', args);

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) {
        onData(line);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    if (onError) {
      onError(data.toString());
    }
  });

  // Return cleanup function
  return () => {
    proc.kill();
  };
}
