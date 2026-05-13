import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performCliAuth } from '../src/lib/auth.js';

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export performCliAuth function', () => {
    expect(typeof performCliAuth).toBe('function');
  });

  // Note: Full integration tests for auth flow would require mocking
  // fetch, child_process.exec, and the polling mechanism.
  // These tests verify the module structure is correct.
  // End-to-end testing will be done manually against the live API.
});
