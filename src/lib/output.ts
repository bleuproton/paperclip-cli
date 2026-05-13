import { stdout, stderr } from 'process';
import kleur from 'kleur';

let jsonMode = false;
let quietMode = false;

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

export function setQuietMode(enabled: boolean): void {
  quietMode = enabled;
}

export function shouldUseJson(): boolean {
  return jsonMode || !stdout.isTTY;
}

export function table(rows: Record<string, any>[], columns: string[]): void {
  if (shouldUseJson()) {
    json(rows);
    return;
  }

  if (rows.length === 0) {
    return;
  }

  const columnWidths = columns.map(col => {
    const headerWidth = col.length;
    const maxValueWidth = Math.max(...rows.map(row => String(row[col] || '').length));
    return Math.max(headerWidth, maxValueWidth);
  });

  const header = columns.map((col, i) => col.toUpperCase().padEnd(columnWidths[i])).join('  ');
  console.log(kleur.bold(header));
  console.log(kleur.dim('-'.repeat(header.length)));

  rows.forEach(row => {
    const line = columns.map((col, i) => {
      const value = String(row[col] || '');
      return value.padEnd(columnWidths[i]);
    }).join('  ');
    console.log(line);
  });
}

export function json(data: any): void {
  if (stdout.isTTY) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(JSON.stringify(data));
  }
}

export function statusBadge(status: string): string {
  const badges: Record<string, (s: string) => string> = {
    backlog: kleur.gray,
    todo: kleur.blue,
    in_progress: kleur.yellow,
    in_review: kleur.magenta,
    done: kleur.green,
    blocked: kleur.red,
    cancelled: kleur.dim,
    active: kleur.green,
    paused: kleur.yellow,
    terminated: kleur.red,
  };

  const colorFn = badges[status] || kleur.white;
  return colorFn(status);
}

export function ok(msg: string): void {
  if (quietMode) return;
  console.log(kleur.green('✓'), msg);
}

export function warn(msg: string): void {
  if (quietMode) return;
  stderr.write(kleur.yellow('⚠') + ' ' + msg + '\n');
}

export function error(msg: string): void {
  stderr.write(kleur.red('✗') + ' ' + msg + '\n');
}
