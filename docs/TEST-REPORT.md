# TYPEBENCH v1.0.0 — release qualification

Date: 2026-10-01. Result: **all listed automated checks passed**; no known release-blocking defect remains in the tested environment. Tests were performed in reviewed batches and repeated after relevant corrections. This report describes exercised behavior, not a guarantee for every browser, document, or device.

## Environment

- Linux execution container, Node.js 24.19.0.
- Headless Chromium **153.0.8010.0**, driven by Playwright 1.63.0.
- Development browser executable supplied with `CHROMIUM_EXECUTABLE`; no browser binaries are required to use the web app.
- Security-disabling Chromium launch flags were explicitly excluded.
- Ephemeral localhost static servers at both `/` and `/typebench/`.
- Desktop widths of 1440 px; responsive checks at 390 and 320 px; a 720 px layout viewport to approximate a 1440 px screen at 200% scale. This is not a physical browser-zoom test.
- axe-core/Playwright 4.13.0, WCAG 2 A/AA and 2.1 AA rule tags.

## Automated suites

| Suite | Named checks | Covered workflows |
|---|---:|---|
| Core | 18 | Unicode, mixed separators, BOMs/encodings, path validation, undo, multi-change preservation, large paste |
| Editing engine | 15 | Search, regex, captures, zero-width matches, grouped replacement, comment/indent/move/duplicate, 100,000 replacements |
| Languages | 24 | Every selectable highlighted language, filenames, source preservation, Processing/Arduino API tokens, safe code escaping |
| Foundation browser | 23 | New/open/edit/save/download/rename/duplicate/close/recover, independent undo, refresh, workspace interchange, conflict/quota failures, drop import, sizes, offline, Mac modifier simulation |
| Editing browser | 16 | Find/replace UI, regex timeout/cancel, stale results, commands, go-to-line, line operations, tabs/spaces, focus escape, offline search |
| Markdown browser | 8 | GFM, sketch fences, safe HTML, controlled images, HTML/source exports, formatting/EOL fidelity, outline/divider persistence, PDF, offline and mobile |
| Files browser | 10 | Direct file handles, write/overwrite conflict, denied permissions, fallback, ZIP paths, recovery, modes, examples, Fresh Start |
| Accessibility/visual | 11 | Empty state; settings and editor/preview in all three themes; commands; find; narrow mobile/reduced motion; constrained layout |
| Release checks | 4 | Root route, panel resize persistence, active mobile tab, invalid workspace protection |
| Additional qualification | 7 | Storage retry and recovery, internal heading links, keyboard tab deletion, runtime-field isolation on workspace import, offline UTF-16 ZIP, path collisions, 5 MiB editing |
| Upgrade from v0.1.0 | 2 | Existing working copy survives installed service-worker upgrade; default settings/search work afterward |
| Upgrade from v0.2.0 | 2 | Same compatibility check against the previous delivered release |
| Packaged deployment | 1 | Extracted ZIP, subdirectory start, Mac shortcut labels, Arduino fence preview, offline reload and exports with no external requests |

Machine-readable results accompany this file. A named check can contain several assertions. Final corrections were verified with the relevant suites; print-only CSS was rechecked through the complete Markdown suite and visually reviewed as a rendered PDF.

## File fidelity and recovery

Byte-for-byte round trips covered UTF-8 with and without BOM, UTF-16LE/BE with BOM, Unicode including emoji and combining marks, LF/CRLF/CR in one file, trailing spaces, and final newlines. Downloads and ZIP output were read back and compared to their inputs. Workspace export/import retained source and manual language selection. Existing schema-1 browser workspaces survived both previous-release upgrades.

Two app windows attempted competing saves; the stale write was blocked and could be exported. Simulated storage quota failure retained the live text and offered recovery export. Restoring storage availability and pressing Retry saved the copy, which survived refresh. Closing tabs retained recoverable content; in-session close/reopen retained undo history. Fresh Start produced an empty workspace after reload.

Permission-based save tests used **actual browser FileSystemFileHandles from OPFS**, with the native chooser substituted by test code. They exercised real read/write/close operations, renaming during an in-flight write, outside changes, explicit overwrite confirmation, permission-error handling, and download fallback. They do **not** qualify native operating-system picker dialogs or all browser permission UI.

## Markdown security

Imported scripts, event-bearing image tags, iframes, style imports, and unsafe links did not execute. No image network request occurred before explicit permission. One approved image made one request to its intercepted address; Block images removed it. HTML exports had a restrictive CSP, highlighted code, and no executable script or image elements. Original Markdown downloads stayed byte-identical. Worker parsing and all exports tested offline after shell installation.

Safe preview intentionally escapes arbitrary embedded HTML. It is not a general HTML renderer. Preview task checkboxes are read-only; their source is editable. Image approval is session/view-specific, and images are omitted from exported HTML.

## Size and performance observations

These are observed timings on this container, not minimum hardware specifications. Some suites ran concurrently. Inputs were short-line plain text; source-code grammar complexity and Markdown DOM size were not benchmarked at the same sizes.

| Input | Open until active | Open + exact download |
|---|---:|---:|
| 100 KiB | 130 ms | 186 ms |
| 1 MiB | 236 ms | 292 ms |
| 5 MiB | 882 ms | 1,001 ms |
| 10 MiB | 1,579 ms | 1,714 ms |

A **1 MiB single line** also round-tripped exactly. A separate **5,242,886-byte** file was edited, downloaded, undone, and compared with the original in **1,198 ms** for that operation sequence. The editing-engine suite applied **100,000 replacements** and restored the exact original with undo.

No arbitrary file-size gate is imposed. These observations do not certify multi-gigabyte documents, enormous highlighted files, or huge Markdown tables. Regex has a roughly 2.5-second worker budget; the pathological `(a+)+$` case timed out without blocking editing/download. Markdown preview has a 5-second budget with a longer explicit retry. Large preview DOMs and huge replacements may still pause the UI, and browser storage/memory can run out.

## Visual and accessibility review

Screenshots in `screenshots/` were reviewed for workspace dominance, readable syntax, status clarity, toolbar reachability, clipping, and responsive behavior. Dark, light and high-contrast themes were checked. The app displayed v1.0.0 during the release screenshots.

The first-use view begins empty with New, Open, and New Markdown; examples are optional. Tabs, command search, dialogs, dividers, find, and source editing were exercised through keyboard paths. Escape then Tab leaves the editor, including when Tab-to-indent is enabled. Delete closes the focused tab into recovery. Reduced motion was emulated.

The final axe runs found **zero violations in the tested states** for the selected rule tags. This is not an accessibility certification. Review found and corrected tab-close ARIA semantics, unlabeled task checkboxes, scrolling code blocks without keyboard focus, a cramped phone formatting row, hidden-source find navigation, and dark-theme print margins.

`print-sample.pdf` is a one-page A4 output generated by Chromium and visually inspected after rasterization. Its page background is white regardless of theme, with readable code, table, task list, and no application controls. It is not a tagged/accessibility-qualified PDF.

## What was not qualified

- Physical macOS/Windows/iOS/Android hardware, touch keyboards, IME composition, or screen readers.
- Firefox, Safari, or Edge-specific behavior; real OS open/save picker dialogs.
- A public production deployment or a server-specific cache/CDN configuration.
- Actual 200% browser zoom; a constrained layout width was used instead.
- Multi-gigabyte documents, ZIP64 archives, prolonged multi-day editing, browser eviction under OS memory pressure, or power loss at every save boundary.
- Every language dialect, newest C#/Java/PowerShell syntax, or contributed Arduino/Processing library. Highlighting is lexical presentation, never semantic validation.

Undo histories and disk handles do not persist across refresh. Relative image references resolve against the app directory, not the imported file's disk folder. Native file conflict detection cannot lock other desktop programs out between checking and writing. These limits are documented in the README and are intentional v1.0 boundaries.

## Release evidence

Production dependency audit reported zero registry-known vulnerabilities at the time of the check (`dependency-audit.json`). This is an advisory snapshot, not proof of complete security. The GitHub-ready ZIP contains the deployable static files, source, build/test scripts, lockfile, GNU GPL v3 application license, bundled dependency notices, this report, screenshots, and SHA-256 file checksums. No account, runtime build, CDN, or application backend is required.
