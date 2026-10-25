# The Bard’s Quill

Approved scope: Next.js + TypeScript; dark theatre design; faithful/dramatic styles; local and server-provided OpenAI translation; 20-entry device history; service-worker offline reload.

## Work record

- Existing isolated checkout retained, as requested. No worktree or deployment needed.
- Tests established first for local translation, API validation/provider errors/rate limits, and browser workflows.
- Ruling: use a bounded, in-memory per-instance rate limiter. Hosting must sanitize forwarded IP headers; shared production limits require a durable store. This starter control cannot guarantee a deployment-wide budget.
- Ruling: local mode describes grammar transformations as approximate. Unknown vocabulary is preserved rather than given invented meanings.
- Ruling: npm cache uses `/tmp/bards-npm-cache` because the default home cache is unavailable here.
- Live OpenAI validation requires a secure server credential; none was present at implementation start.

## Verification targets

Unit and route tests, typecheck, lint, production build, production browser tests including service-worker offline reload. No provider secret is committed or requested in chat.

## Review

- Independent read-only review identified the in-flight history deletion race and context-free determiner substitution; both reproduced with failing regression tests before fixes.
- History append now reads the latest device history, so completed AI requests do not resurrect deletions. Local grammar preserves `no` determiners and stationary here/there, and distinguishes common object-before-infinitive constructions.
- Ruling: cache version bump remains a documented deployment requirement; deployment is outside this task. Forgetting it can leave older offline assets installed.
- Ruling: live model quality needs a credential; visual review is performed locally by the implementer; local linguistic fidelity remains approximate. No deployment-wide billing protection is claimed by the process-local rate limiter.

## Final results

- `npm test`: 26 tests passed (16 local grammar/style tests, 10 API tests).
- `npm run lint`, `npm run typecheck`, `npm run build`: passed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e`: 7 tests passed on the production build, including the history-race regression, storage failures, 20-entry cap, examples, copy/clear, mobile keyboard use and offline disconnect/reload.
- Desktop/mobile screenshots inspected; replaced a font-dependent arrow with SVG.
- Both review findings reproduced RED and verified GREEN. No unresolved important review findings. Live OpenAI smoke test remains unrun without credentials.
- No deployment, external publication, Git push or automatic commit performed.
