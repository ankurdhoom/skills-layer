# Contributing

Thanks for helping improve Skills Layer CLI.

This public repository is intentionally limited to the CLI, MCP setup, local agent integration, packaging, docs, and package-level tests. Do not submit backend service code, Cloud admin tooling, Guardian scoring internals, credentials, or private release material here.

## Local Checks

Run these from the repository root before opening a pull request:

```bash
npm run typecheck
npm run test:coverage
```

The package has no runtime dependencies and no npm lifecycle scripts. Please keep it that way unless a public CLI feature has a clear need.

## Pull Request Checklist

- Keep user-facing CLI output readable and agent-friendly.
- Preserve predictable `--json` behavior for agent workflows.
- Avoid leaking internal service details or private operational commands.
- Update README/help text when behavior changes.
- Add focused tests for changed behavior.
