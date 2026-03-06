---
name: hono
description: Look up Hono framework documentation
---

## Hono Development

Use the Hono CLI (`pnpm exec hono`) for efficient development. View all commands with `pnpm exec hono --help`.

### Core Commands

- **`pnpm exec hono docs [path]`** - Browse Hono documentation
- **`pnpm exec hono search <query>`** - Search documentation
- **`pnpm exec hono request [file]`** - Test app requests without starting a server

### Quick Examples

```bash
# Search for topics
pnpm exec hono search middleware
pnpm exec hono search "getting started"

# View documentation
pnpm exec hono docs /docs/api/context
pnpm exec hono docs /docs/guides/middleware

# Test your app
pnpm exec hono request -P /api/users src/index.ts
pnpm exec hono request -P /api/users -X POST -d '{"name":"Alice"}' src/index.ts
```

### Workflow

1. Search documentation: `pnpm exec hono search <query>`
2. Read relevant docs: `pnpm exec hono docs [path]`
3. Test implementation: `pnpm exec hono request [file]`
