# Changelog

## 1.2.0 — 2026-10-01

Completed in three batches: folder tree/actions, recursive imports, and workflow/release qualification.

- Add a nested file/folder tree with disclosure controls, persistent collapsed states, natural sorting, keyboard navigation, and folder context menus.
- Create nested and empty folders, create files inside them, rename/move whole subtrees, and confirm deletion with grouped recovery across refresh. All operations affect browser working copies.
- Import whole folders with a directory picker or recursive drag and drop, retaining relative paths and known empty directories. Drain repeated directory-reader batches so drops with more than 100 entries are complete.
- Add import progress, atomic cancellation during reads, collision-safe root/path naming, and downloadable reports for skipped binary/unreadable files. Preserve supported source encodings and exact text.
- Extend schema 1 with optional folders, collapsed states, and folder recovery records. Include empty directory entries in ZIPs; support empty-folder-only exports.
- Keep ordinary file drops, snippets, direct saves, and bracket completion; cache unchanged tab/tree rendering to avoid unnecessary rebuilding on typing.
- Correct context menu dismissal during queued focus-scroll events and remove decorative modal backdrop blur to keep large-workspace dialogs responsive.
- Add folder data/API/browser/recovery tests and update deployment, compatibility, and browser-limit documentation. No new runtime dependency.

## 1.1.0 — 2026-10-01

Completed in three reviewed batches: snippets, contextual editing, and release qualification.

- Create a snippet from selected source, with inherited highlighting, live preview, theme/background/transparency, font size, padding, tab width, filename caption, and optional line numbers.
- Save PNG/SVG/styled HTML; copy embeddable HTML, fenced Markdown, or original selected code. All generation stays local and works offline. Clipboard failures offer copy/download fallback.
- Parse syntax in a timed worker using the surrounding document, while saving/exporting only the selected content and token colors.
- Save reusable snippets with workspace autosave and JSON backups. Search, reopen/export, insert with one undo step, open as a document, update, save a copy, and delete with confirmation.
- Add right-click menus on tabs/file rows, visible file action buttons, and keyboard equivalents for open/save/download/rename/duplicate/delete. Actions target the clicked file; deletion stays recoverable and never deletes disk files.
- Add optional CodeMirror automatic closing of `()`, `[]`, and `{}`, selection wrapping, closer skipping, and isolated undo for paired Backspace. Existing text and imported/pasted code are unchanged.
- Extend schema 1 compatibly with optional snippets and bracket settings, include the new worker in offline caches, and keep the static deployment structure.
- Add image-memory feedback, safe SVG/HTML escaping, new browser/security/accessibility tests, and updated documentation.

## 1.0.0 — 2026-10-01

Completed the bounded editor release in reviewed development batches.

- **Language batch (0.3):** all requested languages, filename detection/manual overrides, dedicated Processing and Arduino API tokens, shared editor/fence highlighting.
- **Markdown batch (0.4):** source/split/preview, adjustable divider, optional proportional scroll sync, outline, counts, grouped formatting, GFM, styled HTML and print/PDF.
- **File batch (0.5):** permission-based direct saving and Save as, outside-file change detection, permanent download fallback, worker-based ZIP export preserving relative paths and native encodings.
- **Usability/offline batch (0.6):** Easy/Advanced controls, explicit examples, New Markdown, storage retry, scoped offline caches/update notices, improved mobile layout.
- **Qualification batch (0.9 → 1.0):** security/resource-control tests, schema-1 upgrade checks, keyboard and accessibility corrections, three-theme visual review, final documentation and GPL v3 release packaging.
- Raw HTML is escaped, generated Markdown is sanitized, and remote images require explicit approval. HTML exports omit images and contain a restrictive CSP.
- Added accessible tab closing via Delete, labels for task checkboxes, keyboard scrolling for code blocks, and find/go-to-line source reveal from preview.
- Preserved existing text, mixed line endings, encoding/BOM metadata, recovery, and per-tab undo semantics. Undo history and file handles remain session-only.

## 0.2.0 — 2026-10-01

Everyday editing milestone.

- Added find/replace, case sensitivity, Unicode-aware whole words, match counts and navigation.
- Added Advanced regex with capture replacements and zero-width matches, running in a cancellable worker with a time budget.
- Added a searchable command menu, go-to-line/column, and platform-aware shortcut labels.
- Added indent/outdent, code comments, duplicate lines and move lines, with isolated undo operations.
- Added indentation style/width, optional Tab-to-indent and visible whitespace settings without rewriting existing files.
- Preserved mixed separators during line moves and optimized separator tracking for large Replace All operations.
- Included the worker in offline caching and retained schema-1 workspace compatibility.
- Kept Markdown preview, complete language coverage and direct file saving in their planned later milestones.

## 0.1.0 — 2026-10-01

First editing-foundation milestone.

- Added local CodeMirror 6 editing with independent tab undo histories.
- Added blank documents, picker/drop import, rename, duplicate, download, recoverable close, and Fresh Start.
- Preserved mixed LF/CRLF/CR endings, Unicode, trailing whitespace, final newline, UTF-8 BOM and BOM-marked UTF-16LE/BE.
- Added browser autosave and refresh recovery, workspace JSON interchange, write-conflict protection, and storage failure export.
- Added starter language highlighting including Processing/Arduino base grammars.
- Added three themes, font/wrap/tab display settings, responsive toolbar and persistent document-panel sizing.
- Bundled all runtime dependencies and added offline shell caching scoped to the deployment directory.
- Included GPL v3 application licensing, dependency notices, readable source, test scripts and measured results.

Known milestone boundaries: Markdown remains source-only; broader language coverage, sketch-specific API recognition, advanced editing commands, direct disk saves, workspace ZIP export and print/HTML exports are upcoming roadmap batches. Undo histories restart after refresh.
