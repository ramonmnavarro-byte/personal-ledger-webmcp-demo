# Privacy Architecture

## Boundary

Personal Ledger is a fictional local demo. Its runtime boundary is the browser tab. It accepts no real financial data and has no pathway to a bank, payment processor, identity provider, external API, remote database, file, shell, message, calendar, or CRM.

## Data flow

1. Immutable TypeScript fixtures provide the Northstar Household labels and transactions.
2. Pure selectors calculate cash-flow and category summaries using integer cents.
3. UI filters read the fixtures without persisting preferences.
4. A session object stores draft entries in a closure-backed in-memory array.
5. Clear or reload discards all drafts and returns to fixture-only state.
6. WebMCP handlers call the same validators and selectors as the interface.

No cookies, local storage, session storage, IndexedDB, analytics, telemetry, or outbound runtime request is used.

## WebMCP least privilege

- Read tools are annotated read-only, non-destructive, and closed-world.
- The draft tool is non-destructive and closed-world. Its description explicitly states that it cannot post, send, pay, upload, or connect.
- JSON schemas are strict objects with `additionalProperties: false`.
- Runtime validation rejects unexpected fields, invalid categories, non-integer or out-of-range cents, malformed dates, URL-like text, address-like text, and long digit sequences that resemble account identifiers.
- Result limits are capped at 20.
- Registration is scoped to the document lifecycle with an abort signal.

## Security headers

The local application config disables framework identification and supplies CSP, frame denial, MIME sniffing protection, a no-referrer policy, and a restrictive permissions policy. The Vercel compatibility draft uses a production-oriented header set. Development-only allowances exist solely for local Vinext hot reload and are not included in the Vercel header draft.

## Scanner

`npm run privacy:scan` fails when authored runtime, documentation, public assets, or hosting configuration contains:

- credential-like secrets or private keys;
- private filesystem paths;
- non-local remote URLs;
- long financial/account-like identifiers;
- cookies, browser storage, tracking, or telemetry APIs;
- production financial, identity, database, or CRM connectors;
- non-null Sites D1/R2 configuration or an auth declaration.

Dependency metadata is reviewed separately with `npm audit` because package lockfiles legitimately contain registry URLs and integrity hashes.

## Explicit non-goals

This demo does not make recommendations, classify spending as good or bad, move money, reconcile accounts, import statements, identify a person, or store durable records. It is demonstration software, not financial advice.
