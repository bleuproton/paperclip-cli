import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from './client.js';
import { AuthError } from './errors.js';
import ora from 'ora';

const execAsync = promisify(exec);

interface Challenge {
  id: string;
  token: string;
  boardApiToken: string;
  approvalUrl: string;
  pollPath: string;
  expiresAt: string;
}

interface ChallengeStatus {
  status: 'pending' | 'approved' | 'denied' | 'expired';
  boardApiToken?: string;
}

export async function performCliAuth(baseUrl: string): Promise<string> {
  // Create challenge without auth
  const challengeClient = createClient({ baseUrl, token: '' });

  const challenge = await challengeClient.post<Challenge>('/api/cli-auth/challenges');

  console.log(`Opening browser to: ${challenge.approvalUrl}`);
  console.log('Waiting for approval...');

  // Open browser
  await openBrowser(challenge.approvalUrl);

  // Poll for approval
  const spinner = ora('Waiting for approval').start();

  try {
    const token = await pollForApproval(baseUrl, challenge.id, challenge.token);
    spinner.succeed('Authentication approved');
    return token;
  } catch (error) {
    spinner.fail('Authentication failed');
    throw error;
  }
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      await execAsync(`open "${url}"`);
    } else if (platform === 'win32') {
      await execAsync(`start "${url}"`);
    } else {
      await execAsync(`xdg-open "${url}"`);
    }
  } catch (error) {
    console.log(`Failed to open browser automatically. Please visit: ${url}`);
  }
}

async function pollForApproval(
  baseUrl: string,
  challengeId: string,
  token: string,
  maxAttempts = 60
): Promise<string> {
  const client = createClient({ baseUrl, token: '' });

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(2000); // Poll every 2 seconds

    try {
      const status = await client.get<ChallengeStatus>(
        `/api/cli-auth/challenges/${challengeId}`,
        { token }
      );

      if (status.status === 'approved' && status.boardApiToken) {
        return status.boardApiToken;
      }

      if (status.status === 'denied') {
        throw new AuthError('Authentication was denied');
      }

      if (status.status === 'expired') {
        throw new AuthError('Authentication challenge expired');
      }
    } catch (error) {
      // Continue polling on network errors
      if (error instanceof AuthError) {
        throw error;
      }
    }
  }

  throw new AuthError('Authentication timeout');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
