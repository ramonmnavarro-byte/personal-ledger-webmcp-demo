# Personal Ledger WebMCP Demo

A local-only, public-safe demonstration of a fictional household ledger that becomes more useful when a person and a WebMCP-capable agent work together.

## Safety boundary

- Every household, merchant, amount, date, category, and account label is invented.
- The app offers demonstration information only and is not financial advice.
- Draft entries exist only in memory for the current page session. Reloading or clearing drafts resets them.
- There are no bank, payment, identity, email, calendar, CRM, filesystem, shell, credential, analytics, tracking, cookie, browser-storage, or telemetry capabilities.
- The project does not use D1, R2, authentication, or any production connector.
- No public Site or Vercel project has been created by this repository.

## Local review

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Open the local address printed by the development server. The current review port is `4173` when available.

## WebMCP surface

The app feature-detects `document.modelContext` and registers exactly three tools through `document.modelContext.registerTool`:

1. `get_ledger_summary` — bounded, read-only fictional balance and cash-flow summary.
2. `list_demo_transactions` — read-only, capped filtering by date, category, and type.
3. `create_demo_entry` — an ephemeral session-only fictional draft. It cannot post, send, pay, upload, or target an external system.

All input schemas set `additionalProperties: false`. The runtime validators enforce the same allowlists and bounds rather than relying on schema validation alone. Registration uses an `AbortController` so the page can unregister all tools when it unmounts.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run eval
npm run privacy:scan
npm run build
npm run build:vercel
npm run test:e2e
npm audit
```

`npm run verify` runs the local static checks, coverage, evaluation harness, privacy scan, the Sites/Vinext production build, and the separate Next.js build referenced by the local Vercel configuration.

## Hosting preparation

The generated Sites/Vinext structure and original npm lockfile are preserved. `.openai/hosting.json` keeps D1 and R2 disabled. `vercel.json` contains a local compatibility draft and security headers for tomorrow’s hosting decision; it has not been used to create or deploy anything.

See [Privacy Architecture](docs/PRIVACY-ARCHITECTURE.md), [Local Release Manifest](docs/RELEASE-MANIFEST.md), [Video Script](docs/VIDEO-SCRIPT.md), and [Thumbnail Brief](docs/THUMBNAIL-BRIEF.md).
