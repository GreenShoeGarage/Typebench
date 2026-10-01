# TYPEBENCH v1.0.0

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

Double-clicking `index.html` is only a limited fallback: basic editing and downloads may work, but browser storage for file URLs varies, worker-based search/preview/ZIP may be blocked, and service-worker installation is unavailable. Use HTTPS hosting or localhost for the complete editor.

When updating a server, replace the deployable files as one release, ideally with an atomic directory switch. Uploading only `index.html` is insufficient.

## Everyday editing

- **New** creates a blank text document. **New Markdown** is available on the empty workbench and in Commands. Optional examples are explicitly loaded and never appear in a new workspace by themselves.
- **Open files** imports one or several local text files. Drag and drop works too. Duplicate open names receive a suffix. Supported folder-relative paths are retained when supplied by the browser; recursively opening dropped folders is not supported.
- Documents have independent tabs, modified markers, selections, scroll positions, and undo/redo histories. Rename, duplicate, close, recover, and all other actions are searchable in **Commands**.
- Rename supports relative paths such as `sketches/blink.ino`. This changes the workspace name, not a disk file's location. Renaming detaches a direct-save handle so the next Save asks for a destination.
- Line numbers, current-line highlighting, bracket matching, indentation, word wrap, font size, whitespace display, line editing, and comment commands are built in.
- **Easy** exposes the main workflow. **Advanced** additionally exposes indentation style/width, Tab-to-indent, and whitespace settings. All commands remain searchable in both modes. Changing modes never changes document content.
- Dark, paper-light, and high-contrast themes, panel sizes, and settings persist. Mobile supports viewing and basic editing; split view stacks vertically on narrow screens. The desktop split divider is adjustable by pointer or keyboard.

Closing a tab moves it to **Recently closed**. Recovering it preserves text and, within the same session, undo history. **Fresh Start** permanently removes open and recently closed working copies from this browser workspace after confirmation, with an export option. It does not delete disk files.

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

**Export workspace** creates a readable schema-1 JSON file containing all open and recently closed documents, exact text, names, encoding/BOM metadata, languages and manual overrides, selection, file-copy baselines, active tab, view modes, and relevant settings. It excludes disk handles, undo history, and image permissions.

**Import workspace** validates the file before replacing the current workspace. Replacement requires confirmation, with an export-first action. v0.1.0 and v0.2.0 workspace files remain compatible.

**Export workspace documents as ZIP**, in Commands, exports all **open** workspace documents in their native encodings with their relative paths. Recently closed copies remain in recovery and workspace JSON; reopen any you want in the ZIP. ZIP export runs in a worker and can be canceled. Paths that collide as files/folders or differ only by letter case must be renamed before ZIP export, preventing ambiguous extraction on common filesystems.

Paths must be relative. Absolute paths, `..`, empty path segments, Windows-reserved names, reserved characters, and trailing dots/spaces are rejected. Individual downloads use the basename because browsers choose their destination; JSON and ZIP preserve supported relative paths.

Working copies autosave about 400 ms after a meaningful change. Undo history survives tab switches and close/reopen within a session; refresh restores content/settings/selection but starts a new undo history. A crash before autosave completes can lose the latest pending change. The status indicator and unload warning expose this boundary.

Browser storage is scoped by browser profile, origin, and application directory. Private browsing, clearing site data, eviction, a different host/port/path, or device loss can remove access to it. Export JSON and native files for independent backups. Browser persistence is not encrypted storage or cloud backup.

- Storage failure leaves the work in memory and shows **Export recovery copy** and **Retry browser save**. Export before closing the page.
- Competing app tabs use an atomic revision check. A stale tab's autosave is blocked instead of overwriting the other tab. Export the conflicting copy, then reload the saved workspace. There is no automatic merge.
- Failed imports leave existing work intact. Ordinary error notices can be dismissed; recovery/conflict warnings remain visible until resolved.

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
3. Reopen that same address while offline. Editing, all bundled highlighting, Markdown preview, find/replace, native downloads, JSON and ZIP exports work locally. Direct-save support still depends on the browser and permission. Remote images are not made available by app installation.

The shell includes HTML, CSS, bundled application code, search/preview/ZIP workers, favicon, README, and top-level license notices. Documents are separately stored in IndexedDB, never in the service-worker cache or on the hosting server. Both cache and browser storage can be evicted; exports remain essential.

**Commands → Check for offline app update** checks the server. A ready update shows a notice. Save/export, close all app windows, then reopen. No forced reload interrupts an editing session. New caches are scoped to the application URL. When a new worker activates after the old clients close, it removes older caches in that same scope. Legacy v0.1/v0.2 caches are conservatively retained because they were not scope-namespaced; they are unused by v1.0. Clearing site data also clears documents, so export first.

No telemetry, analytics, remote fonts, accounts, cloud synchronization, or routine external service calls are present. Loading the app/updating its shell contacts your chosen host; manually approved images and clicked links contact their destinations.

## Tested scope and limitations

See [`docs/TEST-REPORT.md`](docs/TEST-REPORT.md) and the machine-readable result files for the release checks, measured sizes, and screenshots. Qualification used headless Chromium on Linux. Mac key conventions and mobile widths were emulated, not tested on physical Mac/iOS/Android devices. Firefox, Safari, Windows, real assistive technology, and native operating-system picker dialogs have not been manually qualified in this environment. Direct-write tests use actual browser FileSystemFileHandles with a substituted chooser.

The editor has no arbitrary file-size gate. Text imports larger than 1 MiB show opening feedback. Practical limits depend on device memory, browser storage quota, parser complexity, line length, preview DOM size, and replacement count. Plain text at 100 KiB, 1 MiB, 5 MiB, and 10 MiB, plus a 1 MiB single line, is covered by the qualification suite. This is not a guarantee of smooth editing for every similarly sized source file. ZIP is a conventional in-memory archive; multi-gigabyte archives/ZIP64 are not supported or tested. Export huge collections in smaller workspaces.

Known intentional boundaries: no code execution, semantic validation, linting service, Processing playback, Arduino upload, terminal, server file management, collaboration, cloud sync, Git, binary editor, ZIP import, recursive directory management, or rich HTML editing. Undo history and disk handles are session-only. Remote image content is not embedded in HTML exports. These boundaries keep v1.0 focused on reliable text editing.

## Source and maintainer workflow

- `src/`: application, editor, language registry, safe preview, file I/O, search, worker code, optional examples
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
```

The test runners accept `CHROMIUM_EXECUTABLE=/absolute/path/to/chromium`; otherwise they use the development-only Chromium package. OS compatibility of that package differs from the browser app. Browser tests start ephemeral localhost servers. The optional upgrade test accepts `TYPEBENCH_BASELINE_DIR` pointing at an unpacked earlier release. The supplied production assets already work without any of these commands. Development dependency installation uses the package registry; everyday app use does not.

Architecture references: [CodeMirror](https://codemirror.net/docs/), [Lezer highlighting](https://lezer.codemirror.net/examples/highlight/), [Marked](https://marked.js.org/), [DOMPurify](https://github.com/cure53/DOMPurify), [fflate](https://github.com/101arrowz/fflate), [File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

## License and maintenance

Copyright © 2026 Green Shoe Garage. The application is licensed **GNU GPL v3 only** (`GPL-3.0-only`); the complete license is in `LICENSE`. Bundled dependencies retain their own licenses and notices in `THIRD-PARTY-NOTICES.md` and `licenses/`. No proprietary runtime services are required.

v1.0 completes the bounded editor workflow. Future maintenance should prioritize browser compatibility, performance, recovery, and syntax-mode updates. A compiler, cloud service, terminal, and project manager are outside this product's initial scope.
