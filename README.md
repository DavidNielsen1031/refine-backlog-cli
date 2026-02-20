# refine-backlog-cli

Transform messy backlog items into structured, actionable work items from the command line.

Powered by the [Refine Backlog API](https://refinebacklog.com).

## Install

```bash
npm install -g refine-backlog-cli
```

Or use directly with `npx` (no install needed):

```bash
npx refine-backlog-cli "Fix login bug"
```

## Usage

```bash
# Single item
npx refine-backlog-cli "Fix login bug"

# Multiple items
npx refine-backlog-cli "Fix login bug" "Add dark mode" "Improve performance"

# From file (one item per line)
npx refine-backlog-cli --file backlog.txt

# Pipe from stdin
cat backlog.txt | npx refine-backlog-cli

# User story format + Gherkin acceptance criteria
npx refine-backlog-cli "Fix login bug" --user-stories --gherkin

# Add product context for better results
npx refine-backlog-cli "Fix login bug" --context "B2B SaaS product for PMs"

# JSON output (great for piping into other tools)
npx refine-backlog-cli "Fix login bug" --format json

# Pro/Team tier with license key (more items per request)
npx refine-backlog-cli --file backlog.txt --key YOUR_LICENSE_KEY
```

## Output

**Default (markdown):**
```
## Fix User Login Bug

**Problem:** Users cannot authenticate with valid credentials after a password reset flow.

**Estimate:** M | **Priority:** HIGH
**Rationale:** Blocks user access and directly impacts retention.

**Acceptance Criteria:**
- Users with valid credentials can log in successfully after password reset
- Error messages are clear when login fails
- Session persists appropriately after login

**Tags:** bug, auth, user-experience
```

**JSON (`--format json`):**
```json
{
  "items": [
    {
      "title": "Fix User Login Bug",
      "problemStatement": "...",
      "acceptanceCriteria": ["..."],
      "estimate": "M",
      "priority": "HIGH",
      "rationale": "...",
      "tags": ["bug", "auth"]
    }
  ]
}
```

## Options

| Flag | Description |
|------|-------------|
| `--file, -f <path>` | Read items from a file (one per line) |
| `--user-stories` | Format titles as "As a [user], I want [goal], so that [benefit]" |
| `--gherkin` | Format acceptance criteria in Given/When/Then syntax |
| `--format <fmt>` | `markdown` (default) or `json` |
| `--context, -c <text>` | Product context for better output quality |
| `--key, -k <key>` | License key for Pro/Team tier |
| `--version, -v` | Show version |
| `--help, -h` | Show help |

## Tiers

| Tier | Items/Request | Price |
|------|--------------|-------|
| Free | 5 | No key needed |
| Pro | 25 | $9/mo |
| Team | 50 | $29/mo |

[Get a license key →](https://refinebacklog.com/pricing)

## CI/CD Usage

**GitHub Actions — refine issues on creation:**
```yaml
name: Refine Backlog Item
on:
  issues:
    types: [opened]

jobs:
  refine:
    runs-on: ubuntu-latest
    steps:
      - name: Refine issue
        run: |
          REFINED=$(echo "${{ github.event.issue.title }}" | npx refine-backlog-cli --format json --key ${{ secrets.REFINE_BACKLOG_KEY }})
          echo "$REFINED"
```

**Shell script batch processing:**
```bash
#!/bin/bash
cat sprint-items.txt | npx refine-backlog-cli --gherkin --user-stories > refined-sprint.md
```

**npm script in package.json:**
```json
{
  "scripts": {
    "refine": "npx refine-backlog-cli --file backlog.txt --user-stories --gherkin"
  }
}
```

## Links

- [refinebacklog.com](https://refinebacklog.com) — web interface
- [API docs](https://refinebacklog.com/openapi.yaml) — OpenAPI spec
- [Pricing](https://refinebacklog.com/pricing) — upgrade for higher limits
- [GitHub](https://github.com/DavidNielsen1031/refine-backlog-cli) — source

## License

MIT
