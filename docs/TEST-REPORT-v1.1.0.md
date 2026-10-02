# TYPEBENCH v1.1.0 — release qualification

Date: 2026-10-01. All listed checks passed in the tested environment. Work was implemented in batches, followed by functional and visual reviews. This report documents exercised behavior and limits; it does not certify all browsers or devices.

## Environment

Linux; Node.js 24.19.0; headless Chromium 153.0.8010.0 through Playwright 1.63.0. Tests use local static servers at `/` and `/typebench/`. Chromium flags that disable web security were excluded. Desktop is 1440 px; phone layouts are 390 and 320 px; a 720 px viewport checks constrained layout rather than actual browser zoom. axe-core/Playwright 4.13.0 checks WCAG 2 A/AA and 2.1 AA tags.

## Suites rerun for this release

| Suite | Named checks | Scope |
|---|---:|---|
| Core | 18 | Exact source, Unicode, encodings/BOMs, mixed EOL, paths, undo and large paste |
| Editing engine | 15 | Find/replace, regex, captures, line commands, undo groups, 100,000 replacements |
| Languages | 24 | Bundled language modes, Processing/Arduino APIs, multiline constructs, safe escaping |
| Foundation browser | 23 | Editing/files/tabs, refresh, imports/exports, conflicts/quota, offline, mobile, large files, simulated Mac shortcuts |
| Editing browser | 16 | Search/replacement, commands, indentation, undo, worker timeout/cancel, focus escape, offline |
| Markdown | 8 | GFM, sketch fences, safe HTML, explicit image control, source/HTML/PDF export, offline/mobile |
| Native files and ZIP | 10 | Real file-handle writes, external conflicts, rename during write, denied access, download fallback, ZIP paths, recovery |
| Existing accessibility/layout | 11 | Empty state, all app themes, dialogs/commands/find, mobile, reduced motion |
| Release checks | 4 | Root hosting, persistent resize, mobile active tab, invalid workspace safety |
| Additional qualification | 7 | Storage retry, heading links, keyboard recovery, workspace fidelity, offline UTF-16 ZIP, path collisions, 5 MiB editing |
| Snippet data/export logic | 9 | Safe data validation, exact source, backward compatibility, fenced Markdown, HTML/SVG escaping, raster size guard, XML control handling |
| Snippet browser workflows | 14 | Selection capture, PNG/SVG/HTML/copy, clipboard fallback, themes, persistent reuse, insertion/undo, offline, sketches, mobile, storage recovery |
| Snippet boundaries | 5 | 30,000-character line, oversized PNG feedback, parser timeout/retry, malformed import, competing windows, Fresh Start |
| Context menus and brackets | 13 | Inactive-file targeting, rename/duplicate/save/download/delete/recovery, keyboard/touch menus, themes, pairing/skip/delete/undo, indentation, CRLF and settings |
| Installed v1.0.0 upgrade | 2 | Working copies survive a service-worker update byte-for-byte; default settings and search remain usable |
| Extracted ZIP smoke | 1 | Packaged runtime at subdirectory, Mac labels, Arduino Markdown, offline source/HTML/SVG/PNG exports, no external requests |

Each named check can contain multiple assertions. The JSON reports identify their version and assertions. Earlier v0.1/v0.2 upgrade reports are retained as historical v1.0 evidence; they were not repeated for v1.1. `TEST-REPORT-v1.0.0.md` preserves the prior qualification. One screenshot capture and an early upgrade wait timed out during preliminary runs; isolated reruns passed. A test initially started a selection after indentation rather than at column 1; its cursor setup was corrected. Bracket testing found a real undo grouping issue, fixed by isolating paired Backspace as a single undo step.

## Snippet results and safety

Selected mixed-CRLF/LF Processing source was compared with Copy code and workspace JSON. The original document remained byte-identical. Source before and after the selection did not appear in exported HTML/SVG or saved snippet records. A selection inside an Arduino multiline comment retained its comment color using surrounding parse context. Processing `size`/`PVector` and Arduino `setup`/`loop`/`pinMode`/`digitalWrite`/`HIGH` received the expected token styles.

PNG outputs were read back and checked for format, dimensions at different scales/font sizes, and transparent corner pixels. SVG and PNG samples were visually inspected. Standalone HTML and inline embed output contain escaped source rather than executable scripts. SVG uses native text and shapes, without scripts, external resources or `foreignObject`. Invalid saved-token classes and CSS options cannot become markup. XML-forbidden controls are replaced only in SVG presentation. Markdown fences safely surround nested backticks. Clipboard denial produces selectable text and a downloadable fallback.

Saved snapshots survive refresh and workspace JSON export/import. Updating and copying snippets remain separate operations. Inserting a snippet is one undo/redo step; opening it as a document preserves its stored line endings and language. Simulated quota failure includes new snippets in recovery export and succeeds after storage retry. A stale second browser window cannot overwrite current data. Fresh Start durably removes both documents and snippets after confirmation.

PNG dimensions are capped before allocation at 16,384 px per side and 32 million pixels. A 30,000-character single line gave actionable PNG feedback and still exported its complete SVG/HTML. A simulated nonresponsive syntax worker timed out, left plain exports usable, and recovered on Retry. Those are practical processing safeguards, not import limits.

## Menus and bracket results

Right-clicking inactive tabs/file rows acted on the target file without silently affecting another active file. Rename retained supported relative paths and language selection. Duplicate preserved exact source. Save/download exported the targeted file. Delete from workspace removed only the browser copy from open documents and left it recoverable. Native disk deletion is deliberately absent.

Menus were exercised with Shift+F10, arrows, Home/End, first-letter navigation, Enter, Escape, and Tab; F2 targets the focused file. Explicit buttons support touch and keyboard users. Menus stayed within the viewport at 320 px. Three themes passed the selected automated accessibility checks.

`()`/`[]`/`{}` pairing, cursor placement, closer skipping, selection wrapping, paired Backspace and undo/redo passed. Arduino braces combined with automatic indentation. Existing Processing CRLF bytes were retained. Disabling completion survived reload. Quotes were left literal and imports were unchanged.

## Regression and performance

The established file, recovery, Markdown safety, syntax, and offline workflows passed again. Native save tests use actual browser FileSystemFileHandles backed by OPFS with a substituted chooser; this exercises real file writes but not OS picker dialogs. HTML/scripts remain escaped and remote Markdown resources require explicit permission.

Measured on this container, sometimes with concurrent suites:

| Plain-text input | Open until active | Open + byte-exact download |
|---|---:|---:|
| 100 KiB | 151 ms | 202 ms |
| 1 MiB | 244 ms | 304 ms |
| 5 MiB | 1,053 ms | 1,135 ms |
| 10 MiB | 2,115 ms | 2,247 ms |

A 1 MiB single line also round-tripped exactly; the 5 MiB edit/download/undo workflow passed. These timings are observations, not hardware requirements or guarantees for equivalent-sized complex code/Markdown. Browser memory/storage, parser complexity, and preview DOM size remain practical limits.

## Visual/accessibility review and limits

Screenshots cover the new snippet interface/export palettes and file menus in dark, light, and high-contrast themes, plus 320 px layouts. The editor remains the dominant workspace. Review shortened cramped snippet theme labels. Existing mobile controls, reduced motion, visible focus, and accessible dialogs remained functional. The tested axe states reported zero violations; this is not accessibility certification.

The container lacks some emoji and CJK font glyphs: those appear as boxes in sample raster images even though exact Unicode text survives copy/workspace/native-file tests. Exports use installed system fonts, so available glyphs and SVG rendering can differ on another device. PNG captures the appearance on the exporting device. Snippet previews scroll horizontally; image exports retain full lines. Very large previews or vector output can still be slow.

Not qualified here: physical macOS/Windows/iOS/Android devices, touch keyboards/IME, screen readers, Safari/Firefox/Edge-specific behavior, real OS chooser dialogs, physical browser zoom, long multi-day sessions, multi-gigabyte files/ZIP64, every source dialect, or public-server/CDN deployment. Clipboard behavior can vary by OS and embedding host. Pasted HTML styles can be stripped by a third-party publishing system. Undo history and disk handles remain session-only. Snippets are schema-1 additions: older app releases ignore them, so retain a v1.1 backup before downgrading.

## Package

The ZIP includes root `index.html`, deployable local assets and service worker, readable source, tests/build/package helpers, GPL-3.0-only application license, dependency notices, README/changelog, screenshots and checksums. The extracted runtime is tested without rebuilding, and its hashes are recorded in `package-smoke-results.json`.

The pinned dependency set is unchanged except that the already-bundled CodeMirror autocomplete package is now an explicit direct dependency for bracket closing. The prior dependency-audit JSON is a historical registry snapshot, not a new audit or security guarantee.
