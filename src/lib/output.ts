import { blue, cyan, green, red, yellow, gray } from 'kleur/colors';

let forceJson = false;

export function setJsonMode(enabled: boolean): void {
  forceJson = enabled;
}

export function shouldUseJson(): boolean {
  return forceJson || !process.stdout.isTTY;
}

export function json(data: any): void {
  if (process.stdout.isTTY) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(JSON.stringify(data));
  }
}

export function table(rows: Record<string, any>[], columns: string[]): void {
  if (rows.length === 0) {
    return;
  }

  // Calculate column widths
  const widths: Record<string, number> = {};
  columns.forEach(col => {
    const headerWidth = col.length;
    const maxValueWidth = Math.max(
      ...rows.map(row => String(row[col] ?? '').length)
    );
    widths[col] = Math.max(headerWidth, maxValueWidth);
  });

  // Print header
  const header = columns.map(col => col.toUpperCase().padEnd(widths[col])).join('  ');
  console.log(gray(header));

  // Print separator
  const separator = columns.map(col => '-'.repeat(widths[col])).join('  ');
  console.log(gray(separator));

  // Print rows
  rows.forEach(row => {
    const line = columns.map(col => {
      const value = String(row[col] ?? '');
      return value.padEnd(widths[col]);
    }).join('  ');
    console.log(line);
  });
}

export function statusBadge(status: string): string {
  switch (status) {
    case 'backlog':
      return gray(status);
    case 'todo':
      return cyan(status);
    case 'in_progress':
      return blue(status);
    case 'in_review':
      return yellow(status);
    case 'done':
      return green(status);
    case 'blocked':
      return red(status);
    case 'cancelled':
      return gray(status);
    default:
      return status;
  }
}

export function ok(msg: string): void {
  console.log(green('✓') + ' ' + msg);
}

export function warn(msg: string): void {
  console.error(yellow('⚠') + ' ' + msg);
}

export function error(msg: string): void {
  console.error(red('✗') + ' ' + msg);
}
