# refine-backlog-cli

Transform messy backlog items into structured, actionable work items — from the command line.

Powered by [Refine Backlog](https://refinebacklog.com).

## Quick start

```bash
npx refine-backlog-cli "Fix login bug" "Add dark mode" "Improve search performance"
```

## With a license key (Pro/Team — removes rate limits)

```bash
npx refine-backlog-cli --key YOUR_LICENSE_KEY "Fix login bug" "Add dark mode"
```

Or set it in your environment (recommended for CI):

```bash
export REFINE_BACKLOG_KEY=YOUR_LICENSE_KEY
npx refine-backlog-cli "Fix login bug" "Add dark mode"
```

## Read from a file

One backlog item per line:

```bash
npx refine-backlog-cli --file backlog.txt
```

## Options

| Flag | Description |
|------|-------------|
| `--key <key>` | License key (or set `REFINE_BACKLOG_KEY` env var) |
| `--file <path>` | Read items from a file (one per line) |
| `--user-stories` | Add a user story to each item |
| `--gherkin` | Write acceptance criteria in Given/When/Then format |
| `--format json` | Output raw JSON instead of formatted text |
| `--context <text>` | Project context to guide the AI |

## Use in CI / GitHub Actions

```yaml
- name: Refine backlog
  run: npx refine-backlog-cli --file backlog.txt --format json > refined.json
  env:
    REFINE_BACKLOG_KEY: ${{ secrets.REFINE_BACKLOG_KEY }}
```

## Pipe-friendly

```bash
echo "Fix login bug" | npx refine-backlog-cli
cat backlog.txt | npx refine-backlog-cli --format json | jq '.[0].title'
```

## Get a license key

Free tier: 3 requests/day, 5 items per request.  
Pro ($9/mo): unlimited requests, 25 items.  
Team ($29/mo): unlimited requests, 50 items.

→ [Get a license key at refinebacklog.com/pricing](https://refinebacklog.com/pricing)

## Links

- [Website](https://refinebacklog.com)
- [API docs](https://refinebacklog.com/openapi.yaml)
- [MCP server](https://www.npmjs.com/package/refine-backlog-mcp)
