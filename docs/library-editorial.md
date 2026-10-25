# Dialogue library: editorial record and contribution guide

## Current state — preview, not the planned release

The application supports the planned six-language library. The catalogue is **32 source-checked reproduced passages**, not 100 entries:

| Language | Reproduced passages | Modern context entries |
| -------- | ------------------: | ---------------------: |
| English  |                  16 |                      0 |
| German   |                  10 |                      0 |
| French   |                   6 |                      0 |
| Hindi    |                   0 |                      0 |
| Spanish  |                   0 |                      0 |
| Russian  |                   0 |                      0 |

The 100-entry release requires 80 reproduced passages, 20 verified modern-work context entries, and at least ten entries per language. `npm run audit:release` intentionally exits nonzero until those requirements are satisfied. Functional tests are separate; a passing build does not establish editorial completion. Featured tiles without verified content explicitly say so. The library page discloses the incomplete catalogue.

## Source access blocker

On 25 October 2026, direct archive access returned proxy `403 Forbidden` for `www.gutenberg.org` and `hi.wikisource.org`, including an escalated retry. Three publicly accessible GITenberg edition mirrors were inspected instead. Required archive/publisher domains were saved in the environment configuration draft; this did not apply or publish the network changes. Review and save the network additions in environment settings, then publish the environment as directed by the product. Retry the blocked sources before claiming access works. Publisher access and modern excerpt permission must each be checked; an allowed domain is not evidence of permission.

Domains requested: `www.gutenberg.org`, `gutenberg.org`, `hi.wikisource.org`, `en.wikisource.org`, `fr.wikisource.org`, `de.wikisource.org`, `es.wikisource.org`, `ru.wikisource.org`, `www.folger.edu`, `www.concordtheatricals.com`, `www.faber.co.uk`, `www.bloomsbury.com`. Existing package-manager network presets were preserved.

## Evidence register

| Work            | Edition reviewed                                                                                                                  | Immutable transcription                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hamlet          | eBook #1524; prepared by Dianne Bean; updated 30 December 2017                                                                    | [GITenberg a22cf33](https://raw.githubusercontent.com/GITenberg/Hamlet-Prince-of-Denmark_1524/a22cf334eff1f3d8920cd11a0979a649a38a02d1/1524-0.txt)        |
| Faust, Part One | eBook #2229; Michael Pullen / Gutenberg Projekt-DE; updated 4 August 2010; ISO-8859-1                                             | [GITenberg bc4c779](https://raw.githubusercontent.com/GITenberg/Faust--Der-Trag-die-erster-Teil_2229/bc4c77935b76f32905baeb68449b01f61301aa3b/2229-8.txt) |
| L’Avare         | Œuvres de Molière, Tome Second, Firmin-Didot, 1890; Laurent Le Guillou transcription; eBook #6318; posted 6 June 2012; ISO-8859-1 | [GITenberg 7460fe2](https://raw.githubusercontent.com/GITenberg/L-Avare_6318/7460fe252f76d4bd81e99ab0391d3697cd9abf3a/6318-8.txt)                         |

The underlying works are public domain; source transcriptions include the [Project Gutenberg License](https://www.gutenberg.org/policy/license.html). This is not a blanket statement about every jurisdiction or every later translation. Each displayed entry retains its edition, source, license note, and exact source line range. Whitespace may be folded; punctuation is not silently modernized. German and French English renderings are labeled editorial translations, not attributed to a published translator.

`npm run audit:sources` downloads the pinned text files using curl with normal proxy/TLS settings, decodes their recorded encodings, and checks that each passage occurs within its recorded line range after whitespace normalization. It does not independently establish speaker identity, interpretation, significance, permissions, or translation quality: those require reviewing the surrounding source and edition metadata.

## Adding an entry

1. Read the source edition and surrounding scene. Confirm work, writer, speaker, and any act/scene label. Use named scenes for Faust rather than inventing numbered acts.
2. Establish permission for the **specific text and translation**. For a modern work without reusable text permission, add an original contextual summary and a verified rights-holder/publisher reading link. Do not reproduce or invent the passage.
3. Add a typed `LibraryEntry` to a catalogue module and import it into `lib/library.ts`. Keep the stable ID unchanged after publication; old `?entry=` links depend on it.
4. Reproduced entries need original text, language, format, speaker information, edition, source URL, rights basis, pinned evidence URL/line range, and an original English context paragraph. Non-English passages need a permitted English translation with translator/edition credit, or a clearly labeled editorial translation of a permitted original. Mark excerpts; do not present truncated speech as complete.
5. Context-only entries use `format: 'context'`, omit passage/translation, and state clearly that they contain an original editorial summary. They do not get a Copy passage button. Their publisher links and summary claims require manual verification.
6. Read the finished entry, its translation, and its context as an editor. Check that the character’s views are not represented as the author’s own beliefs, and that editions are not mixed.
7. Run source and release audits, unit/browser tests, lint, typecheck, and build. Confirm the six featured cards pick representative available entries. Missing content must remain visible rather than being replaced with invented evidence.
8. Bump `public/sw.js`’s cache version when content or app assets change; verify both pages and shared entry links reload offline. Catalogue data is bundled with the app; no user content or AI response is stored in the service-worker cache.

## Architecture and reading behavior

- `/library` searches the local catalogue; no AI or server search endpoint is involved. Query normalization removes Latin accent marks only, preserving meaningful vowel marks in Indic scripts.
- Writer, language, and format filters combine with search. Each change resets pagination to 12 and closes the reading view. Six language selectors are available even when a collection is awaiting verified content.
- `/library?entry=<stable-id>` opens the entry regardless of pagination. The reading view preserves speaker labels and paragraph breaks; unknown IDs display a helpful notice. Browser navigation restores URL-selected entries.
- Copy includes the original passage, author/work/locator, edition, source link, and any displayed editorial translation and credit. Source links open in a separate tab and require internet.
- The v2 service worker caches `/` and `/library` and their local JS/CSS. Offline navigations choose the matching pathname; query strings do not change the app-shell cache key. API traffic remains excluded. First-visit readiness waits for installation of both page shells.

## Delivery boundaries

This work continues on `feat/bards-quill-translator`. Push the verified preview with its disclosed editorial blocker rather than label it the finished 100-entry edition. GitHub API access was previously blocked, so automatic pull-request creation may still require an environment access update. No deployment is implied by a Git push.

## Implementation review

An independent read-only review identified stale language parameters in shared links and outdated English-only preview copy. The copy now describes all three verified languages and authors; a browser regression reproduced the stale `language=hi&entry=faust-theory` URL before the filter/URL synchronization fix. Closing the reading view also restores the opening button’s keyboard focus, falling back to search for direct links. No unreviewed modern texts were added to fill the release quota.

## Verification outcome

- Production build, lint, and TypeScript checks passed.
- 32 unit/API tests passed, including six library tests. Foreign-script test fixtures exercise search mechanics, not claims that those language collections are already populated.
- 12 production-browser tests passed, including original/translated search, combined filtering, reset/pagination, copy, direct links, language URL persistence, focus restoration, mobile layout, and offline caching of both documents. A follow-up offline check also passed starting with the library as the first online visit and following the homepage library link without internet.
- All 32 reproduced passages matched their pinned source line ranges in the source audit (three edition files, zero failures). Desktop and mobile screenshots were inspected.
- The **100-entry release audit fails**: 32/100 entries, 32/80 reproduced passages, 0/20 modern context entries; missing Hindi, Spanish, Russian and four additional French entries for the minimum language coverage. This remains an editorial/network blocker, not a passing release.
