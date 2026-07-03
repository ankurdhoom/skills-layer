# Skills Layer CLI

<p align="center">
  <img src="https://unpkg.com/skills-layer/docs/assets/skills-layer-logo.svg" alt="Skills Layer logo" width="120">
</p>

<p align="center">
  <img src="https://unpkg.com/skills-layer/docs/assets/skills-layer-hero.svg" alt="Skills Layer hero image" width="100%">
</p>

<p align="center">
  <img alt="npm package" src="https://img.shields.io/badge/npm-skills--layer-cb3837?style=flat-square&logo=npm&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/node-%3E%3D22-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="CLI" src="https://img.shields.io/badge/interface-CLI%20%7C%20MCP%20%7C%20API-2563eb?style=flat-square">
  <img alt="backend" src="https://img.shields.io/badge/backend-Skills%20Layer%20Cloud-4b5563?style=flat-square">
  <a href="https://github.com/ankurdhoom/skills-layer/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/ankurdhoom/skills-layer/actions/workflows/ci.yml/badge.svg"></a>
</p>

Skills Layer CLI is the open-source CLI, MCP setup, and local agent integration layer for Skills Layer Cloud.

This repository contains the public CLI/local integration surface only. The hosted backend code, marketplace services, Guardian scoring internals, and service operations remain proprietary.

Use it to discover, validate, install, export, and manage agent-ready skill bundles from a terminal. By default, backend-backed commands talk to Skills Layer Cloud. Use another endpoint only when Skills Layer explicitly provides one for your account or environment.

Skills Layer is a headless, agent-first platform for Markdown-first skill bundles centered on `SKILL.md`. It manages catalog metadata, validation, trust reports, installation plans, entitlements, exports, workspace deployment, and local agent materialization. It does not host a separate runtime for every user's skill; your agent, IDE, CLI, or backend remains the execution environment.

<p align="center">
  <img src="https://unpkg.com/skills-layer/docs/assets/skills-layer-flow.svg" alt="Skills Layer flow from SKILL.md bundle to validation, catalog, CLI, MCP, API, and local agent installation" width="96%">
</p>

## What You Can Do

| Capability | What it helps with |
|---|---|
| Discover skills | Search, compare, view featured/trending skills, and inspect trust summaries before install. |
| Validate bundles | Check `SKILL.md` frontmatter, references, trigger quality, archive safety, dependency manifests, and security posture. |
| Install locally | Materialize approved skills into project, global, workspace, or agent-specific folders with portable lockfile support. |
| Work with agents | Use one CLI vocabulary that aligns with Skills Layer MCP and REST surfaces. |
| Publish and maintain | Creator commands cover scaffolding, validation, submission, versioning, issues, reviews, analytics, and listing updates. |
| Govern teams | Workspace commands support team availability, deployment guidance, review, and trust-aware local use. |

<p align="center">
  <img src="https://unpkg.com/skills-layer/docs/assets/skills-layer-marketplace-flow.svg" alt="Skills Layer marketplace and installation flow" width="96%">
</p>

## What A Skill Is

A Skills Layer skill is a versioned bundle built around a required `SKILL.md` file and optional supporting content:

```text
my-skill/
  SKILL.md
  references/
  scripts/
  assets/
```

The bundle is Markdown-first. `SKILL.md` frontmatter becomes structured metadata, larger context usually belongs in `references/`, and validation checks the bundle before users or teams rely on it.

## Install

```bash
npm install -g skills-layer
skills-layer --help
```

For one-off use:

```bash
npx skills-layer --help
```

## Common First Commands

```bash
skills-layer search "project planning"
skills-layer show project-planner
skills-layer trust project-planner
skills-layer install project-planner --dry-run
skills-layer install project-planner
skills-layer validate ./my-skill --json
skills-layer agents list
```

## Backend Defaults

By default, backend-backed commands use `https://api.skills-layer.com`.

Use a Skills Layer-provided endpoint for a single command:

```bash
skills-layer search planning --base-url <provided-api-url>
```

Remember the hosted backend:

```bash
skills-layer backend cloud
```

Remember a Skills Layer-provided local/backend endpoint:

```bash
skills-layer backend local
```

Remember a Skills Layer-provided endpoint:

```bash
skills-layer backend cloud --base-url <provided-api-url>
```

The CLI resolves backend URLs in this order: `--base-url`, `SKILLS_LAYER_BASE_URL`, saved backend preference, saved login config, then `https://api.skills-layer.com`.

## MCP And API

Skills Layer exposes the same product model through CLI, MCP, and REST-style surfaces. Public endpoints include:

- hosted API default: `https://api.skills-layer.com`
- MCP endpoint: `https://api.skills-layer.com/mcp`
- public docs: `https://skills-layer.com/docs`
- user journeys: `https://skills-layer.com/journeys`

Use only endpoints published or explicitly provided by Skills Layer.

## Safety Model

- Inspect trust reports before installing skills into sensitive projects.
- Use `--dry-run` before mutating installs, submissions, workspace deployment, listing visibility, or ownership state.
- Use `guardian check` before letting a skill drive shell, network, file, secret, browser, device, API, generated-code, or model-context actions.
- Keep API keys out of visible command arguments. Login flows use saved sessions, masked prompts, secure headers, or environment-provided secrets.

## What Ships

The npm package ships the public CLI runtime, the executable wrapper, this README, public README images, the package manifest, and the Apache-2.0 license.

It does not ship backend source, database credentials, private service code, or internal release checklists.

## License

See [LICENSE](LICENSE).
