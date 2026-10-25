# The Bard’s Quill

A Shakespeare-inspired English translator with faithful and dramatic prose styles, a dark theatre interface, on-device translation, optional OpenAI translation, and private device history.

The new `/library` page provides searchable, attributed dramatic excerpts, expanded reading, editorial English translations, copying, direct entry links, and offline reading. It is an explicitly labeled **32-passage preview in English/German/French**, not the planned 100-entry six-language release. Source access blocks the remaining editorial work. See [the editorial record and contribution guide](docs/library-editorial.md) for exact coverage, immutable edition sources, permissions, and required next steps.

## Run locally

Requires Node.js 20.9+ (Node 24 used during development) and npm.

```sh
npm ci
npm run dev
```

For AI mode, copy `.env.example` to `.env.local` and supply `OPENAI_API_KEY` securely. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and must support structured JSON output. Never expose a key through a `NEXT_PUBLIC_` variable. Offline translation needs no key. The app always starts in Offline/Faithful mode.

```sh
npm run build
npm run start
```

Service-worker caching runs only in production. Visit the running app once online and wait for “Ready for offline use”; then disconnect and reload to use the local translator. Production requires HTTPS (localhost is allowed for development). The web manifest enables standalone installation in compatible browsers. Unregister the service worker and clear site data when debugging cached builds.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run audit:sources
npm run audit:release
```

Browser tests start the production server, so build first. To use an installed Chromium instead of downloading it, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. If the default npm cache is unavailable, use `npm ci --cache /tmp/bards-npm-cache`.

The source audit compares reproduced passages to their pinned edition line ranges. The release audit currently **fails by design** because 68 entries and required language/modern-work coverage are missing; do not describe the catalogue as complete. Visiting either page online caches both page shells, so `/library?entry=hamlet-to-be` also reloads offline after readiness. External source links still need internet.

## Behavior and privacy

- Local translation uses curated phrases and conservative grammar/vocabulary rules. It is approximate, preserves unknown words, and does not claim historical accuracy. Early Modern English is distinct from modern British English.
- AI mode sends only the entered text and style to the server and OpenAI. It returns an original adaptation with a vocabulary note, not an authentic Shakespeare quotation. The separate footer quote is attributed to Hamlet.
- The latest 20 successful translations are stored in this browser’s local storage. Anyone with access to the device can read them; individual deletion and Clear history remove saved entries. No account, analytics, or server history database is used. OpenAI’s own data policies apply to AI requests.
- `POST /api/translate` accepts `{ "text": "Hello", "style": "faithful" }` (`dramatic` also supported) and returns `{ "translation": "…", "note": "…" }`. Errors return `{ "error": "…" }`. Text must contain 1–1,000 characters after trimming. Responses use `Cache-Control: no-store`; API traffic is excluded from service-worker caching.
- AI requests time out after 20 seconds, have no automatic retries, and cap output at 1,200 tokens. The browser timeout is 25 seconds.

## Before public deployment

Deploy to a Node-compatible Next.js host over HTTPS. Configure the API key securely and confirm the selected model is available to your account with a live AI smoke test. No live-provider test can run without that credential.

The starter rate limiter allows ten AI requests per minute per client IP **per process**. Your trusted reverse proxy must overwrite `X-Forwarded-For`; arbitrary client-provided headers must not reach the app unchanged. For serverless/multiple instances or a public budget guarantee, replace the in-memory limiter with a shared store or edge gateway, add deployment-wide quotas, and configure provider spending alerts/limits. The starter limiter alone is not a billing safeguard. Do not log submitted text or credentials in hosting middleware.

Builds and deployments must refresh the service-worker cache version whenever the app shell changes. Existing sessions receive new versions when online; verify offline startup after each deployment.
