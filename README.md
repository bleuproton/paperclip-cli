# paperclip-cli

End-to-end CLI for controlling Paperclip + storminterview org-bridge + hermes from the terminal.

Used by humans, by Claude (via skill routing), and by paseo agents.

## Installation

```bash
npm install -g @storminterview/paperclip-cli
```

See [INSTALL.md](./INSTALL.md) for alternative installation methods.

## Quick Start

```bash
# Login to Paperclip
paperclip login

# List companies you have access to
paperclip companies ls

# Switch to a company
paperclip companies use storminterview

# View dashboard
paperclip dashboard
```

## Commands

### Routines

Manage routines and scheduled tasks.

```bash
# List all routines
paperclip routines ls

# Create a new routine
paperclip routines create --name "daily-sync" --schedule "0 9 * * *"

# Manually trigger a routine
paperclip routines run <routine-id>

# List routine triggers
paperclip routines triggers ls
```

**Example with live data:**

```bash
# Create a routine for the storminterview company (05e4fba7-f07d-4216-815c-08984486de5f)
paperclip routines create \
  --name "weekly-report" \
  --schedule "0 9 * * MON" \
  --action "generate_report"
```

### Secrets

Manage secrets for your company.

```bash
# List all secret keys (values hidden)
paperclip secrets ls

# Set a secret value
paperclip secrets set API_KEY "your-key-here"

# Set from file
paperclip secrets set API_KEY @secrets.txt

# Set from stdin
echo "secret-value" | paperclip secrets set API_KEY

# Rotate a secret
paperclip secrets rotate API_KEY
```

**Example with live data:**

```bash
# Set a secret for the storminterview company
paperclip secrets set OPENAI_API_KEY "sk-..."
```

### Costs

View cost analytics and spending summaries.

```bash
# Show cost summary (default: by provider, last 7 days)
paperclip costs summary

# Group by agent
paperclip costs summary --by agent --since 7d

# Group by project
paperclip costs summary --by project --since 30d

# Last 24 hours
paperclip costs summary --since 24h
```

**Example with live data:**

```bash
# View costs for storminterview company (05e4fba7-f07d-4216-815c-08984486de5f)
# Grouped by agent, including CEO agent (ae833b7a-04f7-4b78-b4dd-7f0592d61e32)
paperclip costs summary --by agent --since 7d
```

### Approvals

Manage approval requests.

```bash
# List pending approvals
paperclip approvals ls

# List all approvals (approved and rejected)
paperclip approvals ls --status all

# Approve a request
paperclip approvals approve <approval-id>

# Approve with comment
paperclip approvals approve <approval-id> --comment "LGTM"

# Reject a request
paperclip approvals reject <approval-id> --comment "Need more details"
```

**Example with live data:**

```bash
# List approvals for storminterview company
paperclip approvals ls --status pending
```

### Plugins

Manage company plugins.

```bash
# List installed plugins
paperclip plugins ls

# List available plugins (not installed)
paperclip plugins ls --available

# Install a plugin
paperclip plugins install slack-notifications

# Install specific version
paperclip plugins install slack-notifications --version 2.1.0

# Enable a plugin
paperclip plugins enable <plugin-id>

# Disable a plugin
paperclip plugins disable <plugin-id>

# Manually trigger a plugin
paperclip plugins trigger <plugin-id>

# Trigger with data
paperclip plugins trigger <plugin-id> --data '{"message": "test"}'
```

**Example with live data:**

```bash
# Install and enable a plugin for storminterview company
paperclip plugins install github-sync
paperclip plugins enable <plugin-id>
```

### Dashboard

Show company dashboard with metrics and recent activity.

```bash
# View dashboard
paperclip dashboard

# JSON output
paperclip dashboard --json
```

**Example output:**

```
━━━ COMPANY DASHBOARD ━━━

Company: storminterview

Metrics
  Active agents: 3
  Open issues: 12
  Completed this week: 8

Costs (7d)
  Total: $45.23
  Requests: 1,245

Recent Issues
  in_progress STO-42 - Implement new auth flow
  backlog STO-43 - Fix performance regression
  done STO-41 - Update documentation
```

## Configuration

Configuration is stored in `~/.paperclip/config.json`:

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
  }
}
```

### Environment Variables

Override configuration with environment variables:

- `PAPERCLIP_TOKEN` - Override auth token
- `PAPERCLIP_BASE_URL` - Override base URL
- `PAPERCLIP_PROFILE` - Override active profile

**Example:**

```bash
PAPERCLIP_TOKEN=pcp_test paperclip dashboard
```

## Global Flags

All commands support these global flags:

- `--json` - Output as JSON (also enabled automatically when piping)
- `--quiet` - Minimal output (IDs only)
- `--profile <name>` - Use specific profile for this command
- `--company <id>` - Override current company for this command

**Examples:**

```bash
# JSON output
paperclip routines ls --json

# Use different profile
paperclip --profile staging dashboard

# Override company
paperclip --company 05e4fba7-f07d-4216-815c-08984486de5f issues ls
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Authentication error
- `3` - Resource not found
- `4` - Validation error
- `5` - Network error

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

## Live Test Data

When testing against the production API, you can use these known IDs:

- Company: `05e4fba7-f07d-4216-815c-08984486de5f` (storminterview)
- CEO Agent: `ae833b7a-04f7-4b78-b4dd-7f0592d61e32`

## License

MIT
