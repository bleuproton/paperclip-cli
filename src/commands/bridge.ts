import { Command } from 'commander';
import { loadConfig } from '../lib/config.js';
import { sshExec, sshStream } from '../lib/ssh.js';
import { ok, error, warn, json, shouldUseJson } from '../lib/output.js';
import kleur from 'kleur';

const SERVICE_NAME = 'org-bridge.service';

async function status(): Promise<void> {
  const config = loadConfig();
  if (!config.ssh) {
    error('SSH config not found in ~/.paperclip/config.json');
    process.exit(5);
  }

  const activeResult = await sshExec(
    config.ssh,
    `systemctl is-active ${SERVICE_NAME}`,
  );

  const logsResult = await sshExec(
    config.ssh,
    `journalctl -u ${SERVICE_NAME} -n 5 --no-pager`,
  );

  if (shouldUseJson()) {
    json({
      service: SERVICE_NAME,
      active: activeResult.code === 0,
      status: activeResult.stdout,
      recentLogs: logsResult.stdout.split('\n'),
    });
    return;
  }

  const isActive = activeResult.code === 0;
  const statusText = activeResult.stdout || 'inactive';

  if (isActive) {
    ok(`${SERVICE_NAME} is ${kleur.green(statusText)}`);
  } else {
    warn(`${SERVICE_NAME} is ${kleur.red(statusText)}`);
  }

  if (logsResult.stdout) {
    console.log('\nRecent logs:');
    console.log(kleur.dim(logsResult.stdout));
  }
}

async function logs(options: { follow?: boolean; lines?: number }): Promise<void> {
  const config = loadConfig();
  if (!config.ssh) {
    error('SSH config not found in ~/.paperclip/config.json');
    process.exit(5);
  }

  const lines = options.lines ?? 50;

  if (options.follow) {
    const cleanup = sshStream(
      config.ssh,
      `journalctl -u ${SERVICE_NAME} -f`,
      (line) => console.log(line),
      (err) => console.error(kleur.red(err)),
    );

    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
  } else {
    const result = await sshExec(
      config.ssh,
      `journalctl -u ${SERVICE_NAME} -n ${lines} --no-pager`,
    );

    if (result.code !== 0) {
      error(`Failed to fetch logs: ${result.stderr}`);
      process.exit(1);
    }

    console.log(result.stdout);
  }
}

async function restart(): Promise<void> {
  const config = loadConfig();
  if (!config.ssh) {
    error('SSH config not found in ~/.paperclip/config.json');
    process.exit(5);
  }

  const result = await sshExec(
    config.ssh,
    `sudo systemctl restart ${SERVICE_NAME}`,
  );

  if (result.code !== 0) {
    error(`Failed to restart: ${result.stderr}`);
    process.exit(1);
  }

  ok('Bridge restarted');

  // Wait and check status
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await status();
}

async function pause(): Promise<void> {
  const config = loadConfig();
  if (!config.ssh) {
    error('SSH config not found in ~/.paperclip/config.json');
    process.exit(5);
  }

  const result = await sshExec(
    config.ssh,
    `sudo systemctl stop ${SERVICE_NAME}`,
  );

  if (result.code !== 0) {
    error(`Failed to pause: ${result.stderr}`);
    process.exit(1);
  }

  ok('Bridge paused');
}

async function resume(): Promise<void> {
  const config = loadConfig();
  if (!config.ssh) {
    error('SSH config not found in ~/.paperclip/config.json');
    process.exit(5);
  }

  const result = await sshExec(
    config.ssh,
    `sudo systemctl start ${SERVICE_NAME}`,
  );

  if (result.code !== 0) {
    error(`Failed to resume: ${result.stderr}`);
    process.exit(1);
  }

  ok('Bridge resumed');
}

export function registerBridgeCommands(program: Command): void {
  const bridge = program.command('bridge').description('Control org-bridge service');

  bridge
    .command('status')
    .description('Show bridge service status')
    .action(status);

  bridge
    .command('logs')
    .description('Show bridge logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .action(logs);

  bridge
    .command('restart')
    .description('Restart bridge service')
    .action(restart);

  bridge
    .command('pause')
    .description('Stop bridge service')
    .action(pause);

  bridge
    .command('resume')
    .description('Start bridge service')
    .action(resume);
}
