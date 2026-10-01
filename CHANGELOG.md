# Changelog

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
