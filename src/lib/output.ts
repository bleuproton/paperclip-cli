import kleur from 'kleur';

let jsonMode = false;

export function setJsonMode(mode: boolean): void {
  jsonMode = mode;
}

export function shouldUseJson(): boolean {
  return jsonMode || !process.stdout.isTTY;
}

export function json(data: any): void {
  console.log(JSON.stringify(data, null, process.stdout.isTTY ? 2 : 0));
}

export function table(rows: Record<string, any>[], columns: string[]): void {
  if (shouldUseJson()) {
    json(rows);
    return;
  }

  if (rows.length === 0) {
    return;
  }

  // Calculate column widths
  const widths: Record<string, number> = {};
  columns.forEach((col) => {
    widths[col] = col.length;
    rows.forEach((row) => {
      const val = String(row[col] ?? '');
      widths[col] = Math.max(widths[col], val.length);
    });
  });

  // Print header
  const header = columns.map((col) => col.toUpperCase().padEnd(widths[col])).join('  ');
  console.log(kleur.bold(header));

  // Print rows
  rows.forEach((row) => {
    const line = columns.map((col) => {
      const val = String(row[col] ?? '');
      return val.padEnd(widths[col]);
    }).join('  ');
    console.log(line);
  });
}

export function statusBadge(status: string): string {
  switch (status) {
    case 'backlog':
      return kleur.gray(status);
    case 'todo':
      return kleur.cyan(status);
    case 'in_progress':
      return kleur.yellow(status);
    case 'in_review':
      return kleur.magenta(status);
    case 'done':
      return kleur.green(status);
    case 'blocked':
      return kleur.red(status);
    case 'cancelled':
      return kleur.dim(status);
    default:
      return status;
  }
}

export function ok(msg: string): void {
  console.log(kleur.green('✓'), msg);
}

export function warn(msg: string): void {
  console.error(kleur.yellow('⚠'), msg);
}

export function error(msg: string): void {
  console.error(kleur.red('✗'), msg);
}
