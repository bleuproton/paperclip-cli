import { Command } from 'commander';
import { loadConfig } from '../lib/config.js';
import { sshExec, sshStream } from '../lib/ssh.js';
import { ok, error, warn, json, shouldUseJson } from '../lib/output.js';
import kleur from 'kleur';

const SERVICE_NAME = 'hermes.service';
const TIMER_NAME = 'hermes.timer';

async function status(): Promise<void> {
  const config = loadConfig();
  if (!config.ssh) {
    error('SSH config not found in ~/.paperclip/config.json');
    process.exit(5);
  }

  const serviceResult = await sshExec(
    config.ssh,
    `systemctl is-active ${SERVICE_NAME}`,
  );

  const timerResult = await sshExec(
    config.ssh,
    `systemctl is-active ${TIMER_NAME}`,
  );

  const logsResult = await sshExec(
    config.ssh,
    `journalctl -u ${SERVICE_NAME} -n 5 --no-pager`,
  );

  if (shouldUseJson()) {
    json({
      service: SERVICE_NAME,
      timer: TIMER_NAME,
      serviceActive: serviceResult.code === 0,
      timerActive: timerResult.code === 0,
      serviceStatus: serviceResult.stdout,
      timerStatus: timerResult.stdout,
      recentLogs: logsResult.stdout.split('\n'),
    });
    return;
  }

  const serviceActive = serviceResult.code === 0;
  const timerActive = timerResult.code === 0;

  if (serviceActive) {
    ok(`${SERVICE_NAME} is ${kleur.green(serviceResult.stdout)}`);
  } else {
    console.log(`${SERVICE_NAME} is ${kleur.dim(serviceResult.stdout)}`);
  }

  if (timerActive) {
    ok(`${TIMER_NAME} is ${kleur.green(timerResult.stdout)}`);
  } else {
    warn(`${TIMER_NAME} is ${kleur.red(timerResult.stdout)}`);
  }

  if (logsResult.stdout) {
    console.log('\nRecent logs:');
    console.log(kleur.dim(logsResult.stdout));
  }
}

async function run(): Promise<void> {
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
    error(`Failed to run hermes: ${result.stderr}`);
    process.exit(1);
  }

  ok('Hermes run started');
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

export function registerHermesCommands(program: Command): void {
  const hermes = program.command('hermes').description('Control hermes service');

  hermes
    .command('status')
    .description('Show hermes service status')
    .action(status);

  hermes
    .command('run')
    .description('Trigger hermes run')
    .action(run);

  hermes
    .command('logs')
    .description('Show hermes logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .action(logs);
}
