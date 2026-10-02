# TYPEBENCH v1.2.0 — release qualification

Date: 2026-10-01. The checks listed below passed in the tested environment. Development proceeded in three batches: nested folders/actions, recursive imports, then workflow and release qualification. This records observed behavior and limits, not certification for every browser or device.

## Environment

Linux; Node.js 24.19.0; headless Chromium 153.0.8010.0 through Playwright 1.63.0. Static hosting used localhost, including `/typebench/`. Flags that disable browser web security were excluded. Desktop views are 1440 px; mobile layouts are emulated at 390 and 320 px. axe-core/Playwright 4.13.0 checks WCAG 2 A/AA and 2.1 AA tags. Physical devices, OS directory chooser dialogs, and assistive technology were not available.

## Checks run for v1.2

| Suite | Named checks | Scope |
|---|---:|---|
| Core | 18 | Text/Unicode, encodings/BOMs, mixed line endings, paths, undo and large paste |
| Editing engine | 15 | Find/replace, regex/captures, line commands, grouped undo, 100,000 replacements |
| Languages | 24 | Bundled highlighting, realistic Processing/Arduino API and multiline constructs, escaping |
| Snippet data/export logic | 9 | Exact source, validation, compatibility, safe HTML/SVG/Markdown, image size guard |
| Folder data/APIs | 11 | Paths/collisions/moves, malformed recovery data, directory traversal, cancellation, MIME handling |
| Foundation browser | 23 | Editing/tabs/files, refresh, JSON, conflicts/quota, plain-file drops, offline, mobile, large files |
| Native files and ZIP | 10 | Actual browser file-handle writes, conflicts, denied access, fallback, ZIP paths/encodings |
| Existing accessibility/layout | 11 | Empty tree, themes, dialogs, commands, find, reduced motion and narrow layouts |
| Context menus and brackets | 13 | Targeted file actions, keyboard/touch, all themes, bracket pairing/wrap/undo and CRLF |
| Snippet browser | 14 | Sharing formats, clipboard fallback, persistence/reuse, offline, sketch syntax, mobile and recovery |
| Folder browser workflows | 12 | Nested creation/moves, real picker/drop, 126-file traversal, ZIP, recovery, JSON, themes/mobile/offline |
| Folder boundaries | 7 | Atomic cancellation, storage failure/retry, invalid imports, chosen parent, Fresh Start, empty-only ZIP/recovery |
| Installed v1.1.0 upgrade | 3 | Byte-exact recovery, safe defaults/search, nested legacy paths, snippets and bracket preferences |
| Extracted ZIP smoke | 2 | Packaged local runtime, offline snippets/Markdown, nested folder import/reload and exact ZIP output |

Each named check can include multiple assertions. Machine-readable reports identify their version. `unit-results.json` captures the five pure/data suites. Reports still marked v1.1.0 or v1.0.0 are historical, not reruns of this release. In particular, the separate editing-browser, comprehensive Markdown, additional qualification, snippet-boundary and old-baseline upgrade suites were not repeated for v1.2. Prior full qualification is preserved in `TEST-REPORT-v1.0.0.md` and `TEST-REPORT-v1.1.0.md`.

## Folder and import results

Creating `Project/src/empty` makes parent directories and retains the empty leaf. New text/Markdown files target the chosen folder. File rename/move retains full relative paths. Moving a folder updates every descendant together and rejects cycles and conflicting names. Collapse states survive refresh. Arrow navigation, Shift+F10, F2, Escape and visible action buttons remain usable. Root/path collisions receive suffixes without overwriting existing working copies.

The directory picker test supplies an actual temporary directory through Playwright's file-input API, preserving real `webkitRelativePath` values. It imports six source files, including Arduino, TypeScript, SVG text, Markdown and UTF-16BE, and reports a binary PNG as skipped. Reimporting retains both complete hierarchies under distinct root names. This exercises the browser input API, not a human OS chooser interaction.

The directory drop test supplies an actual on-disk folder through Chromium's drag-event protocol. The folder contains 125 top-level files plus a nested Processing sketch: **126 text files**, with a nested empty directory. All files appear, demonstrating repeated directory-reader batches beyond Chromium's 100-entry batch. A separate API test traverses 252 file entries. The combined browser workflow reaches **139 open documents**. All documents remain tabs; the tree is the practical navigator for that size of collection.

ZIP checks compare exact mixed CRLF/LF Arduino bytes and BOM-marked UTF-16BE output. Relative paths and explicit empty directory entries survive. Empty-folder-only workspaces also produce a valid ZIP. JSON import/export retains document source, folders, settings and grouped recovery. Folder deletion is confirmed and recoverable after refresh; an occupied original path produces a new root. Deleted empty folders can be backed up as JSON, imported, and restored without creating dummy files.

Cancellation during a deliberately slow recursive read leaves the workspace unchanged. An unresolved directory read can also be interrupted. A simulated permission error preserves accessible siblings and records the error. Quota-failure injection leaves imported files and folders in recovery JSON; retry and refresh restore the complete successful import. Invalid folder paths, missing recovery roots, repeated recovery references, and mismatched document paths are rejected. Fresh Start clears folder state after confirmation.

Common binary formats are reported and skipped. Supported text extensions override misleading MIME values, including `.ts` reported as video and `.svg` as an image. Text still passes strict encoding/NUL validation. This release imports editable text sources, not every binary asset in a project.

## Regressions, fixes, and upgrade

Ordinary file drag/drop, file saves, undo/recovery, mixed line endings, all snippet outputs, and automatic bracket completion passed again. Native-save tests use real FileSystemFileHandles backed by OPFS with a substituted chooser, not real OS dialogs.

Review found and fixed a queued focus-scroll event that prematurely dismissed a context menu in a long tree. Large-workspace modal interactions repeatedly stalled with the decorative backdrop blur; removing the blur allowed the complete workflow to pass. A regression test caught plain-file drops entering the folder-report route when a modern handle resolved to null; routing now preserves the ordinary file workflow. The empty file panel gained an appropriate accessible group role. Two test assertions were updated to wait for the asynchronous native dialog-close event before inspecting confirmed deletions. Final runs passed.

A service-worker upgrade from the released v1.1.0 preserved mixed-ending text byte-for-byte, a saved snippet and the disabled-bracket preference. Existing slash-separated filenames appeared as nested folders automatically. Optional schema-1 folder fields keep old workspaces importable. Older app versions cannot retain empty folder/group metadata, so keep the v1.2 JSON backup before downgrading.

## Performance observations

Measured during the current foundation run in this container; these are observations, not speed guarantees:

| Plain-text input | Open until active | Open plus exact download |
|---|---:|---:|
| 100 KiB | 144 ms | 208 ms |
| 1 MiB | 279 ms | 437 ms |
| 5 MiB | 1,331 ms | 1,517 ms |
| 10 MiB | 2,318 ms | 2,454 ms |

A 1 MiB single line also round-tripped exactly. There is no arbitrary text-size or file-count gate. Memory, quota, syntax complexity and preview size remain practical limits. All documents have in-memory editor states; very large imports can pause while those states are committed. Cancellation covers scanning and reads, not the final synchronous commit. Multi-gigabyte collections and ZIP64 are not supported or qualified. No claim is made that every 10 MiB code/Markdown file edits as smoothly as plain text.

## Visual, accessibility, and browser limits

Screenshots in `docs/screenshots/` cover nested workspaces and folder menus in dark, light, and high-contrast themes, plus a 320 px menu. All three were visually inspected. The editor remains dominant, folder nesting is visible, menus stay inside the viewport, and the page does not overflow horizontally. Automated tested states reported zero axe violations; this is not accessibility certification. Existing snippet layouts, reduced motion and keyboard focus checks passed again.

Folder picking cannot expose empty directories; directory drops keep them when the browser supplies them. Modern-handle fallback is API-tested, while the real Chromium drop uses entry traversal. Safari/Firefox/Edge-specific behavior, physical macOS/Windows/iOS/Android devices, touch/IME, real OS directory chooser dialogs, screen readers, long multi-day sessions and public-server/CDN deployment are not qualified here. An emulated Mac platform tests shortcuts, not macOS itself.

Imports and folder actions change browser working copies only. There is no native directory write-back, filesystem watching, server file manager, binary editor, code execution or cloud sync. Imports don't retain directory-write permission. Undo and native file handles remain session-only. Browser storage and cached app files may be evicted; independent exports remain necessary.

## Release package

The ZIP contains root `index.html`, deployable local assets/service worker, readable source, tests/helpers, GPL-3.0-only application license, dependency notices, README/changelog, screenshots and SHA-256 checksums. The extracted production assets are tested without rebuilding, and runtime hashes are recorded in `package-smoke-results.json`. The final ZIP manifest is checked against every included file.

No runtime dependency was added or updated for v1.2. The existing dependency-audit JSON is a historical registry snapshot, not a current security audit or guarantee.
