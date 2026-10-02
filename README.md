# TYPEBENCH v1.2.0

**A local workbench for words, code, and sketches.** Made for Green Shoe Garage.

**New or open → edit → preview when useful → save or export.**

TYPEBENCH is a static, local-first text and code editor. It works without an account, subscription, application backend, database server, build step, CDN, or external editing service. CodeMirror 6 provides the editing surface. All runtime dependencies are bundled locally. Hosting the app does **not** store your documents on the server.

## Run or deploy

Unzip the release. Upload these together, retaining their folder structure:

- `index.html` at the root of your chosen directory
- the entire `assets/` folder
- `sw.js`
- `README.md`, `LICENSE`, `THIRD-PARTY-NOTICES.md`, and `licenses/`

The remaining folders contain editable source, tests, and release evidence. The ZIP can also be committed directly as a GitHub repository. No build is needed to use the supplied release.

Root hosting and a subdirectory such as `https://example.com/typebench/` both work. Use the directory URL with its trailing slash. Serve `.js` as JavaScript and `.css` as CSS. HTTPS is needed for service-worker offline setup on a public server. Localhost is also allowed.

For local use with Python installed, open a terminal in the extracted directory:

```sh
python3 -m http.server 8080
```

Open **http://localhost:8080/**. On Windows, use `py -m http.server 8080` if appropriate. This is a static file server, not an application backend. There is no document-upload endpoint. Stop it with Ctrl+C.

Double-clicking `index.html` is only a limited fallback: basic editing and downloads may work, but browser storage for file URLs varies, worker-based search/preview/snippets/ZIP may be blocked, and service-worker installation is unavailable. Use HTTPS hosting or localhost for the complete editor.

When updating a server, replace the deployable files as one release, ideally with an atomic directory switch. Uploading only `index.html` is insufficient.

## Everyday editing

- **New** creates a blank text document. **New Markdown** is available on the empty workbench and in Commands. Optional examples are explicitly loaded and never appear in a new workspace by themselves.
- **Open files** imports one or several local text files. Drag and drop works too. Duplicate open names receive a suffix. Use **Import folder** or drop a folder to import a whole hierarchy of text/code files, preserving its root name and relative paths.
- Documents have independent tabs, modified markers, selections, scroll positions, and undo/redo histories. Rename, duplicate, close, recover, and all other actions are searchable in **Commands**.
- **Right-click a document tab or file row**, or use its **⋯** button, for Open, Save, Download, Rename, Duplicate, and Delete from workspace. The menu targets the clicked file, even if another tab is active. Keyboard: Shift+F10 or the Menu key, then arrows/Home/End, first-letter navigation, and Enter; Escape or Tab dismisses it. F2 renames the focused file.
- Rename / move supports relative paths such as `sketches/blink.ino`, which appear as nested folders in the document panel. This changes the workspace name, not a disk file's location. Renaming detaches a direct-save handle so the next Save asks for a destination.
- Line numbers, current-line highlighting, bracket matching, automatic bracket closing, indentation, word wrap, font size, whitespace display, line editing, and comment commands are built in.
- **Easy** exposes the main workflow. **Advanced** additionally exposes indentation style/width, Tab-to-indent, and whitespace settings. All commands remain searchable in both modes. Changing modes never changes document content.
- Dark, paper-light, and high-contrast themes, panel sizes, and settings persist. Mobile supports viewing and basic editing; split view stacks vertically on narrow screens. The desktop split divider is adjustable by pointer or keyboard.

**Delete from workspace** and closing a tab both move the browser copy to **Recently closed**. They never delete a file from disk or from your server. Recovering it preserves text and, within the same session, undo history. **Fresh Start** permanently removes open and recently closed working copies, folders, and saved snippets from this browser workspace after confirmation, with an export option. It does not delete disk files.

**Settings → Automatically close brackets** is enabled by default. Typing `(`, `[`, or `{` inserts the corresponding closer; typing a closer at an automatically inserted one moves over it. Typing an opener around a selection wraps it. Backspace between a pair deletes both as a separate undo step. CodeMirror chooses when pairing is appropriate; it does not fix unmatched brackets already in a file. Quotes and `< >` are not auto-paired. Imports and pastes are not rewritten. Turn the setting off for literal entry. Enter between braces uses the existing indentation rules.

## Folders and whole-folder import

The document panel is a **nested folder tree**. **+ Folder** accepts a relative path such as `Robot/src/drivers`; missing parents are created. Folder disclosure buttons expand/collapse their contents. **Expand all folders** and **Collapse all folders** are in Commands. Sizes and collapsed states persist across reloads. Empty folders are kept in workspace JSON and document ZIPs.

Right-click a folder, use its **⋯** button, or press Shift+F10/Menu on its row to create a text/Markdown file, create a subfolder, import a folder inside it, rename/move the whole subtree, or delete the folder from the workspace. Enter a full relative destination path to move a file or folder. F2 renames the focused row. Arrow Up/Down and Home/End navigate visible rows; Right expands/enters a folder and Left collapses/goes to its parent. The tree also uses ordinary keyboard-focusable buttons.

**Import folder** opens the browser's directory chooser. You can also drop an entire folder onto the editor. Both recursively read text/code files, including nested Processing `.pde` and Arduino `.ino` sketches. A progress dialog offers cancellation and a downloadable report of skipped items, unreadable files, and collision renames. Cancel during scanning/reading adds nothing. Successful text files are committed together; unreadable or binary files are reported and skipped. Reimporting `Robot` creates `Robot (2)` rather than overwriting the first copy. New path operations prevent case-only or file/folder collisions that would make ZIP extraction ambiguous.

“Import” is local: **nothing is uploaded to your server**. The importer reads working copies, not a live link to the directory. Editing, renaming, moving, or deleting them does not mutate the original folder. Save individual files with the normal Save controls, or export the workspace as ZIP. There is no whole-directory write-back or filesystem watcher. Renaming a subtree detaches any affected direct-save handles.

Folder import preserves supported encodings, BOMs, Unicode, whitespace, and line endings. Common binary formats (images, archives, executables, fonts, etc.) are skipped; strict text decoding also rejects invalid encodings and NUL-containing data. SVG and TypeScript are treated as source even when the browser reports an image/video MIME type. This is a text editor, so exported ZIPs contain the imported text documents and folders, **not a complete binary-asset backup of the original project**. Hidden/generated text files are not silently excluded; select an appropriate folder and review the report.

Folder pickers supply relative filenames but do **not** expose empty directories. Directory drops retain empty folders when the browser exposes them; **+ Folder** can create them manually. Browsers that cannot expose directory contents cannot recursively import a drop. The app detects unsupported folder picking and keeps Open files available. Picker/drop behavior on mobile depends on the browser and operating system. Directory drops have been tested in Chromium; other browsers and real OS picker dialogs still need device qualification.

Deleting a folder requires confirmation and moves its documents and empty subfolders to **Recently closed** as a recoverable group. Restore the whole folder there, including after refresh, or restore individual documents. If its former path is occupied, restoration gives the group a new root name. Closing an individual document still removes its browser copy from the open workspace into recovery; it leaves its folders in place. Every imported document appears as an editor tab, so large collections can make the tab strip crowded. Use the folder tree to navigate them.

## Code snippets and sharing

**Select text or code → Create snippet → style → copy or download.** The button above the editor and **Commands → Create snippet from selection** both use the current selection. Select all if you want the entire document. Snippet creation never edits the source or changes its file-save status.

The preview inherits the document language and uses all 24 bundled modes, including Processing and Arduino. Syntax coloring parses the original document in a local worker, then crops to the selection, so a fragment of a multiline comment retains its color. Only the selected text and its color ranges are saved/exported; surrounding source is not included. No code runs. A slow parser stops after about 5 seconds and offers plain-text exports or a 15-second retry.

Choose dark, light, or high-contrast colors, font size, padding, tab width, background color or transparency, an optional filename caption, line numbers, and their starting value. Changes affect the snippet presentation only. A custom background can reduce contrast; reset the theme to return to its coordinated colors.

| Action | Output |
|---|---|
| Save PNG | Raster image at 1×, 2×, or 3×; transparency is supported. |
| Save SVG | Script-free vector image made of text and shapes, with no external fonts/resources or HTML foreign objects. |
| Save HTML | Standalone styled HTML with selectable code and a restrictive CSP. |
| Copy HTML embed | A self-contained `<figure>` fragment with inline colors for a website's HTML editor. |
| Copy Markdown | A language-tagged fenced block; fences expand safely around backticks in the selection. |
| Copy code | The selected source, with its original line endings before any platform clipboard normalization. |

Clipboard denial/unavailability opens a selected-text fallback with a download button. HTML escapes all source, so embedded scripts remain visible text. SVG contains no executable code or external resources. Third-party publishing systems may remove inline styles; use the standalone HTML or an image if necessary. Publishing a URL still requires uploading an exported file to your own server. There is no upload or hosted-sharing service.

**Save snippet** adds the snapshot to this workspace. **Saved snippets**, in the document panel and Commands, provides search, preview/export, Insert, Open as document, and confirmed deletion. You can save changes to an existing snippet or save a copy. Snapshots are independent of subsequent document edits. To edit a snippet's code, open it as a document, edit it, and create a new snippet. Deleting a saved snippet is confirmed and does not alter source documents.

Saved snippets share the workspace's browser autosave, failure warnings, and conflict protection. They are included in workspace JSON and recovery exports. They are not separate files in document ZIP exports: open them as documents to include them there. Inserting a snippet replaces the current selection as one undoable edit and uses the destination document's preferred line endings. Opening it as a document preserves its stored line endings and language, in a new UTF-8 working copy.

PNG export checks dimensions before allocating a canvas: at most 16,384 pixels per side and 32 million pixels total. If the requested image exceeds that budget, reduce scale/font size, select less code, or use SVG/HTML. This is an image-memory guard, not a file-size restriction. Very large previews and vector exports may still be slow. Lines do not wrap in snippet images; horizontal scrolling in the preview does not crop the export.

Images use fonts installed on the device. Missing Unicode glyphs may appear as boxes, and SVG text/font metrics can differ in another viewer; PNG fixes the current appearance. Textual outputs and saved source retain Unicode. Tabs expand visually in images; unrenderable XML control characters are replaced with the replacement character in SVG only. HTML and image presentations use logical line breaks; workspace snippets and Copy code retain the original selected text. Images are illustrations, not an exact-byte backup.

## Saving: browser copy versus file copy

| Status/action | Meaning |
|---|---|
| Waiting to save / Saving in this browser | The working-copy write is pending. |
| Saved in this browser | The IndexedDB transaction completed. This is not a disk-file save. |
| No file copy yet | A new document has no imported/saved/downloaded baseline. |
| Matches opened file | Text and workspace name match the imported snapshot. |
| File copy has changes | Text or name differs from the latest file-copy baseline. |
| Saved to a file | A permission-based file write successfully closed. |
| Matches last download | Bytes were handed to the browser download mechanism; the app cannot verify that you kept them. |

**Save** uses a browser file picker when direct file saving is available. After selecting a destination, subsequent saves update that file for this session. **Save as** always asks for a destination. On browsers without the picker, Save downloads a copy. **Download** is always available separately and uses the document's native extension.

**Commands → Open files with direct saving** obtains handles that can be saved back to their original files. Ordinary Open files and drag/drop import copies. Direct-save handles are kept only in memory, never in workspace JSON or browser recovery; after refresh, Save asks again. Browser autosave never writes disk files.

Before saving through an existing handle, TYPEBENCH compares a hash of the disk file with its previous snapshot. If it changed outside the editor, you can cancel or explicitly approve replacing the disk edits. Same-origin native saves with the same filename are serialized where Web Locks are available. This does not lock out other programs: an external program could still change a file between the check and write. Use Save as to retain both copies when uncertain.

Permission denial or write failure leaves the working copy available and offers recovery export. Canceling a picker does not change the document. A direct-save operation captures a snapshot; any editing that occurs while that write is in progress remains marked as changed afterward.

## Workspaces, ZIPs, and recovery

**Export workspace** creates a readable schema-1 JSON file containing all open and recently closed documents, exact text, names, encoding/BOM metadata, languages and manual overrides, selection, file-copy baselines, active tab, view modes, saved snippets, folder paths/collapse states, folder recovery groups, and relevant settings. It excludes disk handles, undo history, and image permissions.

**Import workspace** validates the file before replacing the current workspace. Replacement requires confirmation, with an export-first action. v0.1.0, v0.2.0, v1.0.0, and v1.1.0 workspace files remain compatible. Snippets and `folders`, `collapsedFolders`, and `closedFolders` are optional schema-1 fields. Older releases ignore fields they do not know; retain your v1.2 JSON backup before downgrading. Relative document paths still allow parent folders to be reconstructed, but old versions do not preserve empty folders or grouped folder recovery.

**Export workspace documents as ZIP**, in Commands, exports all **open** workspace documents in their native encodings with their relative paths, plus directory entries including empty folders. A workspace containing only empty folders can also be exported. Recently closed copies remain in recovery and workspace JSON; reopen any you want in the ZIP. ZIP export runs in a worker and can be canceled. Paths that collide as files/folders or differ only by letter case must be renamed before ZIP export, preventing ambiguous extraction on common filesystems.

Paths must be relative. Absolute paths, `..`, empty path segments, Windows-reserved names, reserved characters, and trailing dots/spaces are rejected. Individual downloads use the basename because browsers choose their destination; JSON and ZIP preserve supported relative paths.

Working copies autosave about 400 ms after a meaningful change. Undo history survives tab switches and close/reopen within a session; refresh restores content/settings/selection but starts a new undo history. A crash before autosave completes can lose the latest pending change. The status indicator and unload warning expose this boundary.

Browser storage is scoped by browser profile, origin, and application directory. Private browsing, clearing site data, eviction, a different host/port/path, or device loss can remove access to it. Export JSON and native files for independent backups. Browser persistence is not encrypted storage or cloud backup.

- Storage failure leaves the work in memory and shows **Export recovery copy** and **Retry browser save**. Export before closing the page.
- Competing app tabs use an atomic revision check. A stale tab's autosave is blocked instead of overwriting the other tab. Export the conflicting copy, then reload the saved workspace. There is no automatic merge.
- Invalid workspace imports leave existing work intact. Folder imports add successful text files and report skipped items; cancellation adds nothing. Ordinary error notices can be dismissed; recovery/conflict warnings remain visible until resolved.

## Text fidelity and encoding

UTF-8, with or without BOM, and BOM-marked UTF-16LE/BE are supported. File decoding is strict. Invalid encodings and NUL-containing files are rejected without changing existing work. Convert other encodings to UTF-8 externally first.

Unedited LF, CRLF, CR, and mixed line endings are retained, including trailing whitespace and final newlines. New line breaks use the document's most common existing ending (first encountered wins ties); new documents use LF. Pasted/replacement line breaks use that preference. Undo restores original separators. Moving lines keeps the existing separator sequence at the destination positions. New duplicated lines use the preferred ending. Markdown formatting preserves existing separators.

Unicode is not normalized. Changing highlighting, theme, wrap, indentation settings, or view does not reformat text. Indentation settings affect subsequent typing/commands only. Source position and selection counts use CodeMirror's UTF-16 offsets; an emoji can occupy multiple positions. Source character counts use Unicode code points, counting logical line breaks and whitespace. Word counts use letter/number groups, not language-specific linguistic segmentation.

## Syntax languages

| Language | Typical filenames |
|---|---|
| Plain text / Markdown | `.txt`, `.text`, `.log` / `.md`, `.markdown`, `.mdown` |
| HTML / CSS | `.html`, `.htm` / `.css` |
| JavaScript / TypeScript | `.js`, `.mjs`, `.cjs`, `.jsx` / `.ts`, `.tsx`, `.mts`, `.cts` |
| JSON / Python | `.json`, `.jsonld` / `.py`, `.pyw` |
| C / C++ | `.c` / `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp`, `.hxx` |
| Java / C# | `.java` / `.cs` |
| Go / Rust / PHP | `.go` / `.rs` / `.php`, `.phtml` |
| Ruby | `.rb`, `.rake`, `Gemfile`, `Rakefile` |
| Bash / shell | `.sh`, `.bash`, `.zsh`, `.bashrc`, `.bash_profile`, `.zshrc`, `.profile` |
| PowerShell / SQL | `.ps1`, `.psm1`, `.psd1` / `.sql` |
| YAML / TOML / XML | `.yaml`, `.yml` / `.toml` / `.xml`, `.svg`, `.xsl`, `.xsd` |
| **Processing** | **`.pde`** |
| **Arduino** | **`.ino`** |

Use the language selector to override detection. A manual choice survives renaming. **Detect language from filename** in Commands restores automatic detection. `.h` is ambiguous and defaults to C++; choose C manually when needed.

Processing uses Java-style lexical syntax plus common Processing functions, types, and constants, including `setup`, `draw`, `size`, `PVector`, drawing functions, `PI`, and canvas/mouse values. Arduino uses C++ lexical syntax plus `setup`, `loop`, `pinMode`, `digitalWrite`, `analogRead`, `Serial`, `HIGH`, `LOW`, and common types/constants. Comments, strings, numbers, and multiline comments are handled by the base modes; API names inside comments or strings are not separately colored.

Highlighting is **presentation only**. It does not compile, lint, validate types, check libraries, run Processing, or upload Arduino code. The sketch API lists are intentionally finite and do not cover every contributed library. Names can be colored even when shadowed by your own identifiers. Processing's color literals/preprocessor syntax and newer Java constructs may not receive ideal classification. Arduino board extensions/macros, SQL dialects, and newer C#/PowerShell/Ruby/TOML constructs may exceed the bundled lexical modes. TypeScript uses JSX-capable parsing for both `.ts` and `.tsx`; ambiguous angle-bracket assertions may be colored as JSX. Choose Plain text if a parser is distracting; the source remains unchanged.

## Markdown

Choose **Source**, **Split**, or **Preview**. Preview updates after a brief typing pause. The divider size, view choice, and optional proportional synchronized scrolling persist. Sync is based on scroll percentage, not exact paragraph alignment.

Supported Markdown includes headings, emphasis, lists, blockquotes, links, images, rules, fenced code, GFM tables, task lists, and strikethrough. Fences use the same bundled languages as the editor, with aliases such as `pde`/`processing`, `ino`/`arduino`, `js`, `ts`, `py`, `bash`, and `c++`. Unknown fences remain plain text.

Formatting controls insert/remove readable source for headings, bold, italic, strike, lists, tasks, quotes, code, fences, and links. Each operation is undoable as one step. The heading outline navigates the document. Preview task checkboxes are read-only; edit their `[ ]`/`[x]` source. Formatting controls are tucked away in preview-only view. Find and go-to-line reveal source when necessary.

The outline uses parsed Markdown headings. Internal links use lowercase heading text with spaces changed to hyphens; punctuation is removed. Duplicate headings receive `-2`, `-3`, etc. The output prefixes IDs with `tb-` to avoid collisions with application controls. Exact GitHub heading-slug equivalence for all entity/punctuation combinations is not guaranteed.

**Export HTML** produces a standalone styled document with highlighted code and a restrictive content security policy. Images are omitted from exported HTML, leaving labeled placeholders, even if preview permission was granted. **Download** always exports the original source bytes in the document's selected filename/encoding. **Print / PDF** provides a clean document layout for browser printing or Save as PDF. Source-only/plain-code printing is also supported through the browser print command.

### Preview safety and resource control

Raw embedded HTML is displayed as escaped source, not executed or rendered as arbitrary HTML. The generated Markdown is additionally sanitized with DOMPurify and a restrictive tag/attribute allowlist. Scripts, event handlers, frames, styles, forms, SVG, and embedded objects are not allowed. Unsafe links are stripped. Ordinary HTTP(S)/email links open only when clicked.

Images begin as **Load** buttons. Clicking one shows the exact resource address and asks for approval before any request. Permission is limited to that open document view and is cleared on tab change or refresh; **Block images** clears it immediately. Only HTTP(S) and base64 PNG/JPEG/GIF/WebP image data are eligible. SVG image data is not loaded. Relative image URLs resolve against the app's current directory; local sibling images on your disk are not automatically accessible. Browsers may block HTTP images on an HTTPS page.

Image requests can disclose your IP address to the image host. They use no-referrer policy and are not added to the offline app cache. No image requests occur by default. Preview parsing and highlighting run in a local worker; slow previews stop after roughly 5 seconds with a retry option that allows 15 seconds. This is a processing budget, not a file-size cap. Your source remains available if preview fails.

## Find, replace, and shortcuts

Find searches the active document. It supports case sensitivity, Unicode-aware whole-word matching, visible matches, counts, wrapping previous/next navigation, Replace, and Replace all. Enter advances; Shift+Enter goes backward. Replace acts on the selected match or the next match. Replace all is one undoable operation. Editing or switching documents invalidates stale results.

Under **Advanced** in Find, enable JavaScript regular expressions. Anchors are multiline and Unicode matching is enabled; case sensitivity follows Match case. Enter the pattern without `/.../` delimiters. Regex replacements support `$1`–`$99`, `$<name>`, `$&`, `$$`, JavaScript prefix/suffix substitutions, and `\n`, `\r`, `\t`, `\\`. Literal mode leaves those characters literal. Whole-word boundaries treat Unicode letters, numbers, combining marks, and underscore as word characters. No Unicode normalization is applied.

Search runs in a worker with cancellation and a roughly 2.5-second time budget. Invalid or timed-out searches never replace text. Very large replacements or document rendering can still pause the main thread.

| Action | Mac | Windows/Linux |
|---|---|---|
| New | Command+Option+N | Ctrl+Alt+N |
| Open | Command+O | Ctrl+O |
| Save / Save as | Command+S / Command+Shift+S | Ctrl+S / Ctrl+Shift+S |
| Undo / redo | Command+Z / Command+Shift+Z | Ctrl+Z / Ctrl+Shift+Z or Ctrl+Y |
| Find / commands | Command+F / Command+Shift+P | Ctrl+F / Ctrl+Shift+P |
| Go to line | Command+G | Ctrl+G |
| Indent / outdent | Command+] / Command+[ | Ctrl+] / Ctrl+[ |
| Toggle comment | Command+/ | Ctrl+/ |
| Move lines | Option+Up / Down | Alt+Up / Down |
| Duplicate lines | Option+Shift+Down | Alt+Shift+Down |
| Rename | F2 (sometimes Fn+F2) | F2 |
| Leave editor | Escape, then Tab | Escape, then Tab |

Tab switches focus by default. Advanced **Tab key indents** enables indentation; Escape then Tab still leaves the editor. Tabs use Left/Right/Home/End; Delete closes the focused tab into recovery. The command menu uses Up/Down/Enter. Dividers support arrow keys. Dialogs use native modal focus handling. Visible focus, reduced-motion handling, labeled controls, and keyboard-focusable code blocks are included.

## Exactly how offline use works

1. Open the complete deployment over **HTTPS or localhost** while the static files are available.
2. Wait for **Offline ready**. The app's scoped service worker installs only after the full runtime shell is cached and then controls the page.
3. Reopen that same address while offline. Editing, all bundled highlighting, Markdown preview, find/replace, native downloads, JSON/ZIP exports, local folder import, and snippet creation/image/HTML exports work locally. Direct-save support still depends on the browser and permission. Remote images are not made available by app installation.

The shell includes HTML, CSS, bundled application code, search/preview/snippet/ZIP workers, favicon, README, and top-level license notices. Documents are separately stored in IndexedDB, never in the service-worker cache or on the hosting server. Both cache and browser storage can be evicted; exports remain essential.

**Commands → Check for offline app update** checks the server. A ready update shows a notice. Save/export, close all app windows, then reopen. No forced reload interrupts an editing session. New caches are scoped to the application URL. When a new worker activates after the old clients close, it removes older caches in that same scope. Legacy v0.1/v0.2 caches are conservatively retained because they were not scope-namespaced; they are unused by current releases. Clearing site data also clears documents, so export first.

No telemetry, analytics, remote fonts, accounts, cloud synchronization, or routine external service calls are present. Loading the app/updating its shell contacts your chosen host; manually approved images and clicked links contact their destinations.

## Tested scope and limitations

See [`docs/TEST-REPORT.md`](docs/TEST-REPORT.md) and the machine-readable result files for the release checks, measured sizes, and screenshots. Qualification used headless Chromium on Linux. Mac key conventions and mobile widths were emulated, not tested on physical Mac/iOS/Android devices. Firefox, Safari, Windows, real assistive technology, and native operating-system picker dialogs have not been manually qualified in this environment. Direct-write tests use actual browser FileSystemFileHandles with a substituted chooser.

The editor has no arbitrary file-size gate. Text imports larger than 1 MiB show opening feedback. Practical limits depend on device memory, browser storage quota, parser complexity, line length, preview DOM size, and replacement count. Plain text at 100 KiB, 1 MiB, 5 MiB, and 10 MiB, plus a 1 MiB single line, is covered by the qualification suite. This is not a guarantee of smooth editing for every similarly sized source file. ZIP is a conventional in-memory archive; multi-gigabyte archives/ZIP64 are not supported or tested. Export huge collections in smaller workspaces. The folder suite exercises 126 files in one real directory drop (including the browser’s repeated 100-entry directory batches), 139 open documents in the combined workflow, nested empty folders, and mixed-encoding ZIP round trips. All working copies are held in memory; there is no arbitrary file-count limit, but very large trees/import commits can pause the UI. Import progress and cancellation cover scanning and reads; committing editor states is synchronous.

Known intentional boundaries: no code execution, semantic validation, linting service, Processing playback, Arduino upload, terminal, server file management, collaboration, cloud sync, Git, binary editor, ZIP import, native recursive directory write-back, or rich HTML editing. Undo history and disk handles are session-only. Remote image content is not embedded in HTML exports. These boundaries keep TYPEBENCH focused on reliable text editing.

## Source and maintainer workflow

- `src/`: application, editor, language registry, safe preview, snippets, folder tree/import/path logic, context menus, file I/O, search, worker code, optional examples
- `assets/`: deployable local bundles and styles
- `scripts/`: optional build/package helpers
- `tests/`: core, browser workflow, security, encoding, upgrade, and accessibility checks
- `docs/`: test report, result files, screenshots, and print sample
- `licenses/`: full notices for bundled dependencies

To rebuild or run tests as a maintainer (requires Node.js/npm and development dependencies):

```sh
npm ci
npm run build
npm test
npm run test:editing
npm run test:languages
npm run test:browser
npm run test:editing-browser
npm run test:markdown
npm run test:files
npm run test:accessibility
npm run test:release
npm run test:snippets
npm run test:snippets-browser
npm run test:context-brackets
npm run test:snippet-boundaries
npm run test:folders
npm run test:folders-browser
npm run test:folder-boundaries
```

The test runners accept `CHROMIUM_EXECUTABLE=/absolute/path/to/chromium`; otherwise they use the development-only Chromium package. OS compatibility of that package differs from the browser app. Browser tests start ephemeral localhost servers. The optional upgrade test accepts `TYPEBENCH_BASELINE_DIR` pointing at an unpacked earlier release. The supplied production assets already work without any of these commands. Development dependency installation uses the package registry; everyday app use does not.

Architecture references: [CodeMirror](https://codemirror.net/docs/), [Lezer highlighting](https://lezer.codemirror.net/examples/highlight/), [Marked](https://marked.js.org/), [DOMPurify](https://github.com/cure53/DOMPurify), [fflate](https://github.com/101arrowz/fflate), [File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access), [directory picker paths](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory), [directory drop entries](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry).

## License and maintenance

Copyright © 2026 Green Shoe Garage. The application is licensed **GNU GPL v3 only** (`GPL-3.0-only`); the complete license is in `LICENSE`. Bundled dependencies retain their own licenses and notices in `THIRD-PARTY-NOTICES.md` and `licenses/`. No proprietary runtime services are required.

v1.2 adds nested workspace folders and recursive local folder imports to the editor workflow. Next maintenance priorities are broader browser/device qualification, large-preview performance, recovery, and syntax-mode updates. A compiler, cloud service, terminal, and native filesystem manager are outside this product's initial scope.
