import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sshExec, sshStream } from '../src/lib/ssh.js';
import * as cp from 'child_process';
import { EventEmitter } from 'events';

vi.mock('child_process');

describe('ssh.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sshExec', () => {
    it('should execute SSH command and return output', async () => {
      const mockProc = new EventEmitter() as any;
      mockProc.stdout = new EventEmitter();
      mockProc.stderr = new EventEmitter();

      vi.mocked(cp.spawn).mockReturnValue(mockProc);

      const promise = sshExec(
        {
          jumpHost: 'jump@example.com',
          target: 'target@example.com',
          keyPath: '~/.ssh/id_rsa',
        },
        'echo hello',
      );

      // Simulate command output
      setTimeout(() => {
        mockProc.stdout.emit('data', 'hello\n');
        mockProc.emit('close', 0);
      }, 10);

      const result = await promise;

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('hello');
      expect(result.stderr).toBe('');
    });

    it('should capture stderr and non-zero exit code', async () => {
      const mockProc = new EventEmitter() as any;
      mockProc.stdout = new EventEmitter();
      mockProc.stderr = new EventEmitter();

      vi.mocked(cp.spawn).mockReturnValue(mockProc);

      const promise = sshExec(
        {
          jumpHost: 'jump@example.com',
          target: 'target@example.com',
          keyPath: '/path/to/key',
        },
        'false',
      );

      setTimeout(() => {
        mockProc.stderr.emit('data', 'command failed\n');
        mockProc.emit('close', 1);
      }, 10);

      const result = await promise;

      expect(result.code).toBe(1);
      expect(result.stderr).toBe('command failed');
    });

    it('should pass correct SSH arguments', async () => {
      const mockProc = new EventEmitter() as any;
      mockProc.stdout = new EventEmitter();
      mockProc.stderr = new EventEmitter();

      vi.mocked(cp.spawn).mockReturnValue(mockProc);

      const promise = sshExec(
        {
          jumpHost: 'opc@jump.example.com',
          target: 'opc@target.example.com',
          keyPath: '/home/user/.ssh/key',
        },
        'systemctl status nginx',
      );

      setTimeout(() => {
        mockProc.emit('close', 0);
      }, 10);

      await promise;

      expect(cp.spawn).toHaveBeenCalledWith('ssh', [
        '-i',
        '/home/user/.ssh/key',
        '-J',
        'opc@jump.example.com',
        'opc@target.example.com',
        'systemctl status nginx',
      ]);
    });
  });

  describe('sshStream', () => {
    it('should stream output via callback', () => {
      const mockProc = new EventEmitter() as any;
      mockProc.stdout = new EventEmitter();
      mockProc.stderr = new EventEmitter();
      mockProc.kill = vi.fn();

      vi.mocked(cp.spawn).mockReturnValue(mockProc);

      const lines: string[] = [];
      const cleanup = sshStream(
        {
          jumpHost: 'jump@example.com',
          target: 'target@example.com',
          keyPath: '~/.ssh/id_rsa',
        },
        'tail -f /var/log/app.log',
        (line) => lines.push(line),
      );

      mockProc.stdout.emit('data', 'line 1\nline 2\n');
      mockProc.stdout.emit('data', 'line 3\n');

      expect(lines).toEqual(['line 1', 'line 2', 'line 3']);

      cleanup();
      expect(mockProc.kill).toHaveBeenCalled();
    });

    it('should handle stderr via error callback', () => {
      const mockProc = new EventEmitter() as any;
      mockProc.stdout = new EventEmitter();
      mockProc.stderr = new EventEmitter();
      mockProc.kill = vi.fn();

      vi.mocked(cp.spawn).mockReturnValue(mockProc);

      const errors: string[] = [];
      sshStream(
        {
          jumpHost: 'jump@example.com',
          target: 'target@example.com',
          keyPath: '~/.ssh/id_rsa',
        },
        'tail -f /var/log/app.log',
        () => {},
        (err) => errors.push(err),
      );

      mockProc.stderr.emit('data', 'error occurred\n');

      expect(errors).toEqual(['error occurred\n']);
    });
  });
});
