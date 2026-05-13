# paperclip-cli — Build Spec (autonomous build, 4 agents in parallel)

## Mission
End-to-end CLI for controlling Paperclip + storminterview org-bridge + hermes from terminal.
Used by humans, by Claude (via skill routing), and by paseo agents.

## Stack
- Node 20, TypeScript, ESM (`"type": "module"`)
- `commander` for CLI parsing, `kleur` for color, `ora` for spinners
- Native `fetch` (no node-fetch needed in Node 20)
- Tests: `vitest`
- Build: `tsc` → `dist/`; entrypoint `dist/index.js`, bin name `paperclip`

## Paperclip API (live)
- Base URL: `https://paperclip.storminterview.com` (prod), `http://localhost:3100` (local)
- Auth: `Authorization: Bearer <token>` — board API key (long-lived) OR session token from cli-auth flow
- ~300 REST endpoints, see route inventory at end of this file
- KEY ENDPOINTS:
  - `POST /api/cli-auth/challenges` → `{id, token, boardApiToken, approvalUrl, pollPath, expiresAt}`
  - `GET /api/cli-auth/challenges/:id?token=<secret>` → poll until `status: "approved"`, then `boardApiToken` is valid
  - `GET /api/cli-auth/me` → verify
  - `POST /api/cli-auth/revoke-current` → logout
  - `GET /api/companies` → list companies user has access to
  - `GET /api/companies/:cid/issues?status=backlog&limit=20`
  - `POST /api/companies/:cid/issues` body `{title, description?, priority?, assigneeAgentId?}`
  - `PATCH /api/issues/:id` body `{status?, assigneeAgentId?, startedAt?}` — status enum: backlog|todo|in_progress|in_review|done|blocked|cancelled. in_progress REQUIRES assigneeAgentId.
  - `DELETE /api/issues/:id`
  - `POST /api/issues/:id/comments` body `{body}`
  - `GET /api/issues/:id` — full issue
  - `GET /api/companies/:cid/agents` → list agents
  - `POST /api/companies/:cid/agent-hires` body `{role, name?, reportsToAgentId?}` — hire agent
  - `POST /api/agents/:id/pause` / `/resume` / `/wakeup` / `/terminate`
  - `GET /api/agents/me/inbox-lite` → my agent inbox
  - `GET /api/companies/:cid/dashboard` → metrics
  - `GET /api/companies/:cid/costs/summary?window=7d`

## Config
File: `~/.paperclip/config.json`
```json
{
  "currentProfile": "prod",
  "profiles": {
    "prod": {
      "baseUrl": "https://paperclip.storminterview.com",
      "token": "pcp_...",
      "tokenSource": "cli-auth",
      "userId": "RQoW5dZN93oaWD6I2H5Vu3jaE1TZexyu",
      "currentCompanyId": "05e4fba7-f07d-4216-815c-08984486de5f"
    }
  },
  "ssh": {
    "jumpHost": "opc@<JUMP_HOST>",
    "target": "opc@<PROD_HOST>",
    "keyPath": "~/.ssh/yentral-server"
  }
}
```
Default mode 0600. NEVER log tokens. Use `process.env.PAPERCLIP_TOKEN` and
`PAPERCLIP_BASE_URL` as overrides.

## Output
- TTY → human table (use `kleur`, padded columns)
- non-TTY OR `--json` → JSON to stdout
- errors → stderr, exit code 1; specific codes: 2=auth, 3=not found, 4=validation, 5=network

## CLI Surface — minimum v1 (must work end-to-end)
```
paperclip login [--instance <url>]
paperclip logout
paperclip whoami

paperclip use <profile>
paperclip profiles ls

paperclip companies ls
paperclip companies use <slug|id>           # set currentCompanyId

paperclip agents ls
paperclip agents get <id|name>
paperclip agents hire --role <role> [--name <name>] [--reports-to <id>]
paperclip agents pause <id>
paperclip agents resume <id>
paperclip agents terminate <id>

paperclip issues ls [--status <s>] [--assignee <name|me>] [--limit N]
paperclip issues create "title" [--desc text] [--assignee <name>] [--priority <p>]
paperclip issues get <STO-N|uuid>
paperclip issues edit <STO-N> [--status <s>] [--assignee <id>] [--title text]
paperclip issues comment <STO-N> "body"
paperclip issues delete <STO-N>
paperclip issues watch <STO-N>              # polls every 5s, prints activity

paperclip bridge status
paperclip bridge logs [--follow] [--lines N]
paperclip bridge restart
paperclip bridge pause                       # systemctl stop
paperclip bridge resume                      # systemctl start

paperclip hermes status
paperclip hermes run
paperclip hermes logs

paperclip api <METHOD> <path> [--data <json>] [--query k=v]
paperclip openapi [--save <file>]
```

## Layer responsibilities — DIVISION OF WORK

### AGENT 1 — Core foundation
Files:
- `src/index.ts` — commander entry, profile resolver, global flags (--json, --profile, --company)
- `src/lib/config.ts` — read/write `~/.paperclip/config.json` with 0600 perms, profile mgmt
- `src/lib/client.ts` — fetch wrapper: auth header, retries (max 2), error mapping, JSON helpers `get/post/patch/del`
- `src/lib/auth.ts` — cli-auth flow: create challenge, open browser, poll until approved, save token
- `src/lib/output.ts` — table renderer (auto-width), JSON mode, status colorizer
- `src/lib/errors.ts` — custom error classes with exit codes
- `src/lib/resolver.ts` — turn `STO-9` → uuid (GET company issues, match identifier), `slug` → companyId, `name` → agentId
- `src/commands/auth.ts` — `login`, `logout`, `whoami`
- `src/commands/profile.ts` — `use`, `profiles ls`
- `tests/auth.test.ts`, `tests/config.test.ts`

### AGENT 2 — Business object commands (companies/agents/issues)
Files:
- `src/commands/companies.ts` — ls, get, use (set currentCompanyId)
- `src/commands/agents.ts` — ls, get, hire, pause, resume, terminate, wakeup
- `src/commands/issues.ts` — ls, create, get, edit, comment, delete, watch
  - **Important:** `issues edit --status in_progress` MUST add assigneeAgentId (default: CEO of current company) — Paperclip rejects in_progress without assignee.
  - **STO-N resolution:** identifier like `STO-9` needs lookup. Use `GET /api/companies/:cid/issues?limit=200` and match `identifier === "STO-9"`. Cache result for 5min in `~/.paperclip/.cache/issues-<cid>.json`.
- `tests/issues.test.ts` with msw fakes
- Format `issues ls` columns: identifier, status, priority, assignee (name not id), title (truncate 40), age

### AGENT 3 — Service control + API escape hatch
Files:
- `src/lib/ssh.ts` — wrapper around `child_process.spawn('ssh', ['-i', key, '-J', jump, target, cmd])` — returns {stdout, stderr, code}
- `src/commands/bridge.ts` — status/logs/restart/pause/resume via SSH-exec of systemctl commands on prod box (target from config.ssh.target via config.ssh.jumpHost)
  - status: parse `systemctl is-active` + show last 5 log lines
  - logs: stream `journalctl -u org-bridge.service -f` over SSH when --follow, otherwise `-n N`
  - restart: `sudo systemctl restart org-bridge && sleep 2 && status`
- `src/commands/hermes.ts` — status/run/logs (hermes is a systemd timer + service `hermes.service`)
- `src/commands/api.ts` — `paperclip api GET /companies` style raw call, supports --data, --query, auto-auth
- `src/commands/openapi.ts` — fetch from `/api/openapi.json` if exists OR walk all routes via introspection (start with known route list in SPEC)
- `tests/ssh.test.ts` with mocked spawn
- `tests/api.test.ts`

### AGENT 4 — Extended commands + tests + docs + dist
Files:
- `src/commands/routines.ts` — ls, create, run, triggers ls
- `src/commands/secrets.ts` — ls, set (from @file or stdin), rotate
- `src/commands/costs.ts` — summary --by agent|project|provider --since 7d
- `src/commands/approvals.ts` — ls, approve, reject (uses `/api/companies/:cid/approvals`)
- `src/commands/plugins.ts` — ls, install, enable, disable, trigger
- `src/commands/dashboard.ts` — dashboard (text-mode summary using costs+issues+activity)
- `README.md` — full usage docs, install instructions, examples
- `tests/integration.test.ts` — end-to-end against a mock Paperclip server (use `vitest` + a fake fetch handler in `tests/fixtures/`)
- `package.json` — finalize deps, bin, scripts, publishConfig
- `.github/workflows/ci.yml` — node 20 build+test
- `INSTALL.md` — `npm i -g`, also Linux one-liner installer

## Inter-agent contracts (DO NOT BREAK)

### `src/lib/client.ts` interface (Agent 1 writes, others import)
```ts
export interface PaperclipClient {
  get<T = any>(path: string, query?: Record<string, any>): Promise<T>;
  post<T = any>(path: string, body?: any): Promise<T>;
  patch<T = any>(path: string, body?: any): Promise<T>;
  del<T = any>(path: string): Promise<T>;
  rawFetch(path: string, init?: RequestInit): Promise<Response>;
}
export function createClient(opts: { baseUrl: string; token: string }): PaperclipClient;
```

### `src/lib/config.ts` interface (Agent 1 writes)
```ts
export interface Profile {
  baseUrl: string;
  token: string;
  tokenSource?: 'cli-auth' | 'api-key';
  userId?: string;
  currentCompanyId?: string;
}
export interface SshConfig {
  jumpHost: string;
  target: string;
  keyPath: string;
}
export interface Config {
  currentProfile: string;
  profiles: Record<string, Profile>;
  ssh?: SshConfig;
}
export function loadConfig(): Config;
export function saveConfig(c: Config): void;
export function getActiveProfile(): Profile;
export function setActiveProfile(name: string): void;
```

### `src/lib/output.ts` (Agent 1 writes)
```ts
export function table(rows: Record<string,any>[], columns: string[]): void; // prints to stdout
export function json(data: any): void; // pretty-prints when TTY, compact when piped
export function shouldUseJson(): boolean; // checks --json flag or !isTTY
export function statusBadge(status: string): string; // colorize backlog/in_progress/done/etc
export function ok(msg: string): void;
export function warn(msg: string): void;
export function error(msg: string): void;
```

### Global flags resolved before subcommands (Agent 1)
- `--json` → force JSON output
- `--profile <name>` → override active profile for this invocation
- `--company <slug|id>` → override currentCompanyId for this invocation
- `--quiet` → IDs only

## Acceptance criteria

Each agent's PR should pass:
1. `npm run build` clean (no TS errors)
2. `npm test` all green
3. Agent 1: `paperclip login` against prod prints approval URL and polls successfully
4. Agent 2: `paperclip issues ls` against prod returns rows, `issues create` round-trips
5. Agent 3: `paperclip bridge status` returns "active (running)"
6. Agent 4: `paperclip routines ls`, `paperclip costs summary` return data
7. No agent commits secrets or hardcoded tokens

## Branch strategy
- Each agent works on a branch: `agent-1-core`, `agent-2-business`, `agent-3-ops`, `agent-4-extended`
- Agent 1 ships first (others depend on lib/*)
- Agents 2/3/4 rebase onto main after Agent 1 merges
- Merge order: 1 → 2 → 3 → 4

## Test data (live, safe to use)
- Storminterview company ID: `05e4fba7-f07d-4216-815c-08984486de5f`
- CEO agent ID: `ae833b7a-04f7-4b78-b4dd-7f0592d61e32`
- Test API key (will be replaced by cli-auth in production): `pcp_<REDACTED>`
- SSH: `opc@<JUMP_HOST>` (jump) → `opc@<PROD_HOST>` (prod) with `~/.ssh/yentral-server`

## Voice for commits & docs
Sharp, concrete, no AI vocabulary. Name files and functions. No em dashes. Examples:
- "feat(issues): add edit command with assignee auto-fill for in_progress"
- "fix(client): retry on 429 with exponential backoff"
