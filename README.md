# paperclip-cli

End-to-end command line for [Paperclip](https://paperclip.ai) plus the
storminterview `org-bridge` and `hermes` services. Built so a human, a Claude
session, or a paseo agent can drive an entire AI organization from one tool.

```
paperclip issues create "fix login bug" --priority high
paperclip bridge restart
paperclip dashboard
```

[![License: PCPL-1.0](https://img.shields.io/badge/license-PCPL--1.0-blue.svg)](./LICENSE.md)
[![Node 20+](https://img.shields.io/badge/node-%3E=20-brightgreen.svg)](https://nodejs.org)

---

## Table of contents

- [What it does](#what-it-does)
- [Install](#install)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Command reference](#command-reference)
- [How it talks to Paperclip](#how-it-talks-to-paperclip)
- [Driving org-bridge and hermes](#driving-org-bridge-and-hermes)
- [Use from Claude or paseo](#use-from-claude-or-paseo)
- [Development](#development)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What it does

Paperclip is an AI workforce OS. Companies → Agents → Issues. The official UI
is a web app, but for builders the terminal beats clicking.

- **Full issue lifecycle.** Create, edit, comment, assign, transition, watch.
- **Agent management.** Hire, pause, resume, terminate, wake up.
- **Service control.** Restart `org-bridge` and `hermes` on the prod server
  via SSH ProxyJump.
- **Raw API escape hatch.** `paperclip api GET /api/...` covers the ~300
  endpoints the named commands don't.
- **Multi-profile config.** Switch prod / staging / local dev.
- **TTY-aware output.** Tables for humans, JSON when piped.

```
$ paperclip issues ls --status backlog
IDENTIFIER  STATUS    PRIORITY  ASSIGNEE  TITLE
STO-23      backlog   high      ceo       Fix Stripe webhook signature
STO-22      backlog   medium    eng-1     Add idempotency to refund flow

$ paperclip issues ls --json | jq '.[].identifier'
"STO-23"
"STO-22"
```

## Install

### npm

```bash
npm install -g @storminterview/paperclip-cli
paperclip --version
```

### From source

```bash
git clone https://github.com/bleuproton/paperclip-cli.git
cd paperclip-cli
npm install
npm run build
npm link        # makes `paperclip` available globally
```

### One-liner (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/bleuproton/paperclip-cli/main/scripts/install.sh | bash
```

### Requirements

- **Node 20+** (native `fetch`, top-level await, ES modules)
- **git** (for source install)
- **ssh** (for `bridge` and `hermes` commands)

See [INSTALL.md](./INSTALL.md) for Docker, CI, and air-gapped paths.

## Quick start

```bash
# 1. Authenticate via browser device flow
paperclip login

# 2. Verify
paperclip whoami

# 3. List companies
paperclip companies ls

# 4. Pick one as active
paperclip companies use storminterview

# 5. Create an issue
paperclip issues create "Add CSV export" --priority medium

# 6. Watch it run in real time
paperclip issues watch STO-24
```

## Configuration

Lives at `~/.paperclip/config.json`, mode `0600`:

```json
{
  "currentProfile": "prod",
  "profiles": {
    "prod": {
      "baseUrl": "https://paperclip.storminterview.com",
      "token": "pcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "tokenSource": "cli-auth",
      "currentCompanyId": "05e4fba7-..."
    },
    "staging": { "baseUrl": "...", "token": "..." },
    "local":   { "baseUrl": "http://localhost:3100", "token": "..." }
  },
  "ssh": {
    "jumpHost": "opc@paseo.example.com",
    "target": "opc@10.0.0.5",
    "keyPath": "~/.ssh/yentral-server"
  }
}
```

### Environment overrides

| Env var | Effect |
|---|---|
| `PAPERCLIP_BASE_URL` | Override active baseUrl |
| `PAPERCLIP_TOKEN` | Override active token |
| `PAPERCLIP_PROFILE` | Switch profile for one invocation |
| `PAPERCLIP_COMPANY` | Switch company for one invocation |

### Global flags

| Flag | Effect |
|---|---|
| `--json` | Force JSON output |
| `--profile <name>` | Use a specific profile |
| `--company <slug\|id>` | Override active company |
| `--quiet` | IDs only |

## Command reference

### Auth and profiles

```
paperclip login [--instance URL]
paperclip logout
paperclip whoami
paperclip use <profile>
paperclip profiles ls
```

### Companies

```
paperclip companies ls
paperclip companies use <slug|id>
```

### Agents

```
paperclip agents ls
paperclip agents get <id|name>
paperclip agents hire --role <r> [--name N] [--reports-to <id>]
paperclip agents pause <id>
paperclip agents resume <id>
paperclip agents terminate <id>
paperclip agents wakeup <id>
```

### Issues

```
paperclip issues ls [--status S] [--assignee me|name] [--limit N]
paperclip issues create "title" [--desc T] [--assignee A] [--priority P]
paperclip issues get <STO-N|uuid>
paperclip issues edit <STO-N> [--status S] [--assignee A] [--title T]
paperclip issues comment <STO-N> "text"
paperclip issues delete <STO-N>
paperclip issues watch <STO-N>
```

**Status:** `backlog | todo | in_progress | in_review | done | blocked | cancelled`.

`issues edit --status in_progress` auto-attaches the active company's CEO when
no assignee is given (Paperclip rejects `in_progress` without one).

**STO-N resolution:** identifiers like `STO-9` are translated client-side via
`?limit=200` lookup, cached 5 min in `~/.paperclip/.cache/`.

### Goals and projects

```
paperclip goals ls
paperclip goals create "Ship v1" [--due 2026-06-01]
paperclip projects ls
paperclip projects create "Q2 roadmap"
```

### Service control

```
paperclip bridge status
paperclip bridge logs [--follow] [--lines N]
paperclip bridge restart
paperclip bridge pause
paperclip bridge resume

paperclip hermes status
paperclip hermes run
paperclip hermes logs
```

Shells out to `ssh -i KEY -o ProxyCommand="ssh -i KEY -W %h:%p JUMP" TARGET cmd`.
Both legs use the same key from `ssh.keyPath` in config.

### Routines, secrets, costs, approvals, plugins

```
paperclip routines ls
paperclip routines create --name daily --cron "0 9 * * *" --prompt "..."
paperclip routines run <id>

paperclip secrets ls
paperclip secrets set KEY @file
paperclip secrets set KEY -      # value from stdin
paperclip secrets rotate <id>

paperclip costs summary [--by agent|project|provider] [--since 7d]

paperclip approvals ls
paperclip approvals approve <id> [--note "ship it"]
paperclip approvals reject <id> --reason "..."

paperclip plugins ls
paperclip plugins install <id-or-url>
paperclip plugins enable <id>
paperclip plugins disable <id>
paperclip plugins trigger <id> <action> [--data '{"k":"v"}']
```

### Dashboard

```
paperclip dashboard
```

Text-mode aggregate: open issues, recent activity, cost trend, agent health.

### Raw API

```
paperclip api GET /api/companies
paperclip api POST /api/companies/$CID/issues --data '{"title":"x"}'
paperclip api PATCH /api/issues/$ID --data '{"status":"done"}'
paperclip api DELETE /api/issues/$ID
paperclip api GET /api/issues/$ID --query 'include=runs,comments'

paperclip openapi [--save spec.json]
```

Auto-applies Bearer token. Covers the 300+ endpoints the named commands don't.

## How it talks to Paperclip

### Authentication (cli-auth device flow)

1. `POST /api/cli-auth/challenges` → server returns `{id, token,
   boardApiToken, approvalUrl, pollPath}`.
2. CLI opens `approvalUrl` in your browser (with PKCE `code_challenge`).
3. You sign in (Pro/Max/SSO), click Approve.
4. CLI polls `GET /api/cli-auth/challenges/:id?token=<secret>` every 1s.
5. When `status === "approved"`, `boardApiToken` is your `Bearer` token.
   Saved to config.

No API key copy-paste. Browser handles MFA, multi-user, audit.

### Issue model

```ts
{
  id: uuid,
  companyId: uuid,
  identifier: "STO-9",
  title: string,
  description: string,
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked" | "cancelled",
  priority: "low" | "medium" | "high" | "urgent",
  assigneeAgentId: uuid | null,    // required for in_progress
  goalId: uuid | null,
  projectId: uuid | null,
  ...
}
```

### Status transition rules (server-enforced)

- `backlog → in_progress` requires `assigneeAgentId`.
- `* → done` adds `completedAt`.
- `* → blocked|cancelled` always allowed.
- CLI auto-attaches CEO when you `edit --status in_progress` without one.

## Driving org-bridge and hermes

`org-bridge` is the systemd service that polls Paperclip every 60s for backlog
issues, dispatches each to `claude` CLI for execution, posts result back.
`hermes` is a 15-minute timer that analyzes closed issues for patterns and
updates memory.

CLI controls both over SSH ProxyJump:

```
your laptop  →  paseo jump host  →  prod server (bridge + hermes)
```

If you run these services elsewhere, point `ssh.target` at the right host.
CLI doesn't care where they live.

## Use from Claude or paseo

### From Claude Code

Add to `CLAUDE.md`:

```md
## Skill routing

- "list issues" → run `paperclip issues ls`
- "create issue X" → run `paperclip issues create "X"`
- "restart bridge" → run `paperclip bridge restart`
- "deploy status" → run `paperclip bridge status`
```

Claude auto-invokes the CLI on natural language.

### From a paseo agent

```bash
paseo run --provider claude --mode bypassPermissions \
  "Use paperclip CLI to triage today's backlog. Close duplicates with a
   comment. Promote anything tagged urgent. Report what you did."
```

### From a script

```bash
paperclip issues ls --json | jq '
  .[] |
  select(.status == "blocked") |
  select((now - (.updatedAt | fromdateiso8601)) > 86400) |
  .identifier'
```

## Development

```bash
git clone https://github.com/bleuproton/paperclip-cli.git
cd paperclip-cli
npm install

npm run build           # tsc → dist/
npm run dev -- issues ls  # run from source
npm test                # vitest
npm test -- --watch     # tdd loop
npx tsc --noEmit        # type check only
npm link                # paperclip globally
```

### Repo layout

```
paperclip-cli/
├── src/
│   ├── index.ts                  # commander entry, global flags
│   ├── lib/
│   │   ├── client.ts             # PaperclipClient (fetch + retry + auth)
│   │   ├── config.ts             # ~/.paperclip/config.json
│   │   ├── auth.ts               # cli-auth device flow
│   │   ├── resolver.ts           # STO-N → uuid lookups
│   │   ├── output.ts             # table/JSON/badges
│   │   ├── ssh.ts                # ProxyCommand wrapper
│   │   ├── errors.ts             # exit codes (2,3,4,5)
│   │   └── utils.ts
│   └── commands/
│       ├── auth.ts companies.ts agents.ts issues.ts
│       ├── goals.ts projects.ts routines.ts secrets.ts costs.ts
│       ├── approvals.ts plugins.ts dashboard.ts profile.ts
│       └── bridge.ts hermes.ts api.ts openapi.ts
├── tests/                        # vitest + msw
├── .github/workflows/ci.yml
├── SPEC.md                       # original build spec (audit trail)
├── README.md INSTALL.md LICENSE.md
└── package.json tsconfig.json
```

### Adding a new command

1. Create `src/commands/<noun>.ts`. Export `registerXyzCommands(program)`.
2. Use `createClient(await getActiveProfile())` for API calls.
3. Use `table()` and `json()` from `src/lib/output.ts`.
4. Use `shouldUseJson()` to switch output mode.
5. Throw `PaperclipError(message, exitCode)` for failures.
6. Register in `src/index.ts`.
7. Add vitest in `tests/<noun>.test.ts`.

Example:

```ts
import { Command } from 'commander';
import { getActiveProfile, createClient, table, shouldUseJson } from '../lib/index.js';

export function registerLabelsCommands(program: Command): void {
  const labels = program.command('labels').description('Manage labels');
  labels.command('ls').action(async () => {
    const profile = await getActiveProfile();
    const client = createClient(profile);
    const data = await client.get<any[]>(`/api/companies/${profile.currentCompanyId}/labels`);
    if (shouldUseJson()) return console.log(JSON.stringify(data));
    table(data, ['name', 'color', 'description']);
  });
}
```

### Local Paperclip

```bash
paperclip use local
paperclip companies ls
```

### Debugging

```bash
DEBUG=paperclip:* paperclip issues ls
DEBUG=paperclip:http paperclip issues ls   # log every fetch
```

## Architecture

```
                  ┌──────────────────────────┐
                  │      paperclip CLI        │
                  └──────────┬───────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │ HTTPS Bearer     │ SSH ProxyJump    │
          ▼                  ▼
   ┌──────────────┐   ┌──────────────────┐
   │  Paperclip   │   │ paseo jump host  │
   │  REST API    │   └────────┬─────────┘
   │  ~300 endpts │            │ SSH
   └──────────────┘            ▼
                       ┌──────────────────┐
                       │  prod server     │
                       │  org-bridge      │
                       │  hermes          │
                       │  claude CLI      │
                       └──────────────────┘
```

### Design choices

- **TypeScript ESM, Node 20+**. Native fetch, top-level await.
- **commander** for parsing. Mature, good help output.
- **No HTTP library.** Native fetch suffices.
- **SSH via `child_process.spawn`.** No node-ssh dep.
- **`~/.paperclip/config.json` mode 0600.** Plain JSON. Token rotation
  easier than encrypted storage.
- **TTY-aware output.** Tables for humans, JSON for pipes.
- **STO-N client-side resolution.** Cached 5 min.

## Roadmap

Tracked at [GitHub Issues](https://github.com/bleuproton/paperclip-cli/issues).

Near-term:
- [ ] Bash/Zsh/Fish completion
- [ ] `paperclip activity tail` SSE feed
- [ ] Claude Code skill bundle (`~/.claude/skills/paperclip/`)
- [ ] Single-binary build via `pkg`
- [ ] 1Password / Bitwarden integration for token storage
- [ ] OpenAI / Codex executor in org-bridge

Long-term:
- [ ] Plugin system for custom commands
- [ ] Web UI mirror (`paperclip web open`)
- [ ] Mobile companion (Telegram / iOS shortcuts)

## Contributing

PRs welcome. Read [LICENSE.md](./LICENSE.md) — if you ship a derivative, you
owe upstream a contribution or a public fork.

### Workflow

1. Fork on GitHub.
2. Branch: `feat/your-feature` or `fix/your-bug`.
3. Code + tests.
4. `npm run build && npm test` clean.
5. Conventional commits: `feat(issues): add export to CSV`, `fix(ssh): handle
   host key change`, `docs(readme): document watch command`.
6. Open PR with context (what, why, how tested).

### Style

- TypeScript strict. No `any` unless commented.
- No em dashes in user-facing output. Use commas, periods, ellipsis.
- Short sentences, direct verbs, no corporate filler.
- Specific names (`resolveIssueIdentifier` not `resolve`).
- Errors include context (`PaperclipError('Issue STO-9 not found', 3)`).

### Good first issues

Look for `good-first-issue` label. Examples:
- Add column to `issues ls` table.
- Implement `paperclip secrets unset <key>`.
- Add `--watch` flag to `paperclip bridge status`.

## License

[Paperclip CLI Public License v1.0 (PCPL-1.0)](./LICENSE.md).

TL;DR: copy it, modify it, ship it. If you change it, keep the source open
and help upstream move forward. You cannot take this code, make it private,
and sell it as your own.

Not OSI-approved. By design.

---

Built using six parallel paseo agents in 45 minutes.
Audit trail: [SPEC.md](./SPEC.md) and branches `pc-a1` (core), `pc-a2`
(business), `pc-a3` (ops), `agent-4-commands` (extended).
