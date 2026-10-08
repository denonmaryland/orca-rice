# How orca-rice works

Orca is an Electron app: its window is a web page. It has no setting for a background image, no custom stylesheet and
no plugin API (a background-image setting has been asked for upstream). orca-rice styles that page while it runs.

## Getting in

1. `bin/orca-rice` picks a Node to run on: Node 22+ if the Mac has it, otherwise the Node inside Orca
   (`ELECTRON_RUN_AS_NODE`, which Orca's own `orca` command uses too).
2. `lib/compat.mjs` reads the installed `Orca.app` without changing it: its version, Electron's fuse wire (is the
   inspector still allowed?) and the bundled code (are the page structures, CSS variables and settings keys orca-rice
   relies on still there?). Each part (scene, cards, terminal theme, window buttons) is on only if all of its hooks
   are found. The result is kept per Orca version. An update Orca has downloaded but not installed yet is checked too,
   so `doctor` can say what installing it would do.
3. `lib/orca.mjs` sends Orca's main process `SIGUSR1`, only when step 2 found the inspector allowed (with it switched
   off, the signal could end Orca, so it is never sent). Node's inspector opens on `127.0.0.1:9229`. orca-rice
   connects only if `lsof` says the listener is Orca's own process, and refuses if anything else holds the port.
4. Over the inspector it evaluates one expression: the watcher (built in `bootstrap()`, parsed locally first, so code
   that would not parse never reaches Orca). Then it closes the inspector, on every path: over the same connection,
   or a fresh one if the first never opened; the expression also closes it itself after 5 seconds. If the port is
   somehow still open afterwards, orca-rice says so (quitting Orca closes it). Every call has a time limit.

## The watcher

The watcher lives in Orca's main process until Orca quits. It:

- watches `~/.orca-rice/look.json` (and `projects-look.json`), checks every field (mode, colours as `#rrggbb`, a
  theme name made of plain characters, a shader under 400 KB) and passes the result as data to the layer in each
  Orca window, and again whenever a window reloads;
- saves Orca's current settings once, before its first change, to `~/.orca-rice/settings-backup.json` (one read for
  all windows; without a saved copy it changes no settings at all);
- switches Orca's terminal theme through Orca's own settings channel (`window.api.settings`), importing it first
  from `~/.warp/themes` the way Orca's "Import from Warp" does;
- in the card shape, moves macOS's window buttons into the floating title pill;
- once a second, notes which project is in front (for project themes) and checks that the window still runs this
  watcher's layer. A watcher it replaced can have had a push in flight that lands late; if so, it pushes again, at
  most three times;
- touches `~/.orca-rice/status.json` every 15 seconds as a heartbeat. `ensure` treats a quiet watcher as gone.

## The layer

`layer/rice-layer.js` runs in Orca's page:

- **Scene**: one WebGL 2 canvas under the terminal area (or the whole window, with cards), drawing the theme's
  shader (`scenes/`, in Ghostty's custom-shader format) at 10 frames a second while Orca has focus, and holding the
  last frame otherwise. `still` draws one frame (t = 8 s) and draws again only when something on it changes: a
  resize, an agent's light, a ripple. The wallpaper is drawn one fragment per pixel-art block and scaled up, about a
  fortieth of the work of drawing every pixel.
- **Cards**: a stylesheet only. No Orca element is moved or replaced, so taking it out leaves Orca exactly as it was.
- **Agents**: Orca marks each tab with its agent's state (`data-agent-activity-status`). Working agents glow in the
  sky; one waiting on you turns its tile amber; one that finishes sends a ripple.
- **Chat view**: Orca's chat panes take the tile's tint, so the scene shows behind them as it does behind terminals.

`dispose()` removes the canvas, the stylesheet and every attribute orca-rice added.

## Coming back after Orca restarts

Quitting or updating Orca ends the watcher. `orca-rice ensure` puts it back if Orca is running without it, and does
nothing otherwise. `autostart on` installs a LaunchAgent (`~/Library/LaunchAgents/local.orca-rice.ensure.plist`) that
runs `ensure` at login and once a minute. Each run is a process list and a small file read, unless the look needs
putting back.

## Taking it out

`uninstall` (with Orca open) first removes the LaunchAgent and the data file, so nothing can put the look back while
it comes out; then disposes the watcher and the layer, puts the saved settings back through Orca's settings channel
(and stops, keeping everything, if that did not happen), removes the theme files in `~/.warp/themes`, and deletes
orca-rice's own files in `~/.orca-rice`.
