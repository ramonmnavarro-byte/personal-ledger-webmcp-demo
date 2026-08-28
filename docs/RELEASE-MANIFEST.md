# Local Release Manifest

This manifest defines the public-safe source boundary for a future release. It does not authorize or record a deployment.

## Intended authored files

- `app/` — the Personal Ledger page, client interaction, metadata, and local styling.
- `lib/ledger/` — fictional fixtures, types, validation, summaries, filters, and in-memory draft state.
- `lib/webmcp/` — the three-tool WebMCP registration surface.
- `scripts/` — the local evaluation harness and privacy scanner.
- `tests/` — unit, integration, UI, and desktop/mobile browser tests.
- `docs/` — privacy architecture, release manifest, thumbnail brief, and factual video script.
- `public/favicon.svg` — the intentional public icon.
- `.openai/hosting.json` — Sites capability declaration with D1 and R2 disabled.
- Root configuration — `.gitignore`, `package.json`, `package-lock.json`, TypeScript, lint, Vitest, Playwright, Vinext/Vite, Next.js, and local Vercel configuration.
- `README.md` — local operation, safety boundary, and verification commands.

## Explicitly excluded categories

- Dependencies: `node_modules/` and package-manager caches.
- Build output and caches: `dist/`, `.next/`, `.vinext/`, `.vite/`, `.turbo/`, `.cache/`, `out/`, `.wrangler/`, `.vercel/`, and TypeScript build-info files.
- Test and browser output: `coverage/`, `playwright-report/`, `test-results/`, `blob-report/`, `.playwright-cli/`, and Playwright result JSON/XML files.
- Local capture/output folders: `outputs/` and `work/`, including screenshots and silent review recordings.
- Audit scratch files: `work-audit*.json`.
- Environment and secrets: `.env*`, private keys, certificates, and local credentials.
- Local machine noise: `.DS_Store`, generated logs, editor caches, private paths, and temporary files.

Before any future release, run `npm run verify`, `npm run test:e2e`, `npm audit`, and `npm run privacy:scan`, then inspect `git status` and the staged diff. A public release must contain only the intended authored files above.
