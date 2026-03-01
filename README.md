# speclint

Lint your GitHub issues before AI coding agents touch them.

Powered by [Speclint](https://speclint.ai).

---

## Quick start

```bash
npx speclint lint --issue 42 --repo owner/repo
```

---

## `lint` subcommand

Score a GitHub issue for spec completeness.

```bash
npx speclint lint --issue <number> --repo <owner/repo> [--key <license-key>]
```

### Options

| Flag | Description |
|------|-------------|
| `--issue <number>` | GitHub issue number |
| `--repo <owner/repo>` | GitHub repository (e.g. `acme/backend`) |
| `--key <key>` | License key (or set `SPECLINT_KEY` env var) |

### Environment variables

| Variable | Description |
|----------|-------------|
| `SPECLINT_KEY` | Your Speclint license key |
| `GITHUB_TOKEN` | Optional — required for private repos |

### Example

```bash
export SPECLINT_KEY=sk-...
export GITHUB_TOKEN=ghp_...
npx speclint lint --issue 42 --repo acme/backend
```

---

## `enforce` subcommand

Enforce a minimum spec score in CI — fail the pipeline if a GitHub issue doesn't meet the bar.

```bash
npx speclint enforce --issue <number> --repo <owner/repo> [--min-score 80] [--key <license-key>]
```

### Options

| Flag | Description |
|------|-------------|
| `--issue <number>` | GitHub issue number |
| `--repo <owner/repo>` | GitHub repository (e.g. `acme/backend`) |
| `--min-score <number>` | Minimum passing score (default: `80`) |
| `--key <key>` | License key (or set `SPECLINT_KEY` env var) |

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Spec passes minimum score ✅ |
| `1` | Spec fails minimum score ❌ |
| `2` | Error (bad args, API failure, etc.) |

### Environment variables

| Variable | Description |
|----------|-------------|
| `SPECLINT_KEY` | Your Speclint license key |
| `GITHUB_TOKEN` | Optional — required for private repos |

### Example CI usage (GitHub Actions)

```yaml
name: Spec Quality Gate

on:
  issues:
    types: [opened, edited]

jobs:
  speclint:
    runs-on: ubuntu-latest
    steps:
      - name: Enforce spec quality
        run: |
          npx speclint enforce \
            --issue ${{ github.event.issue.number }} \
            --repo ${{ github.repository }} \
            --min-score 80
        env:
          SPECLINT_KEY: ${{ secrets.SPECLINT_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Get a license key

Free tier: limited requests/day.  
Pro ($29/mo): unlimited linting, CI enforcement.  
Team ($79/mo): unlimited, team-wide keys, priority support.

→ [Get a license key at speclint.ai/pricing](https://speclint.ai/pricing)

---

## Links

- [Website](https://speclint.ai)
- [API docs](https://speclint.ai/openapi.yaml)
- [MCP server](https://speclint.ai/mcp/README.md)
- [llms.txt](https://speclint.ai/llms.txt)
