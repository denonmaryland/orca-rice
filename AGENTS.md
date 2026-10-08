# orca-rice: instructions for coding agents

You are helping someone give their **Orca** app (the agent workspace by Stably, github.com/stablyai/orca) the
orca-rice look: 22 themes, floating rounded cards, a pixel-art scene behind the terminals, and a chat view to match.
Codex, Claude Code and any other agent that reads `AGENTS.md` should follow this file.

## The rule: plan first, change nothing until they approve

1. **Look** at their setup with read-only commands (below).
2. **Ask** them the choices (below). Do not pick a theme for them without asking.
3. **Write the plan** (template below) and stop. If you are in plan mode, the plan is your whole answer.
4. **Only after they approve**, run the steps, then report what changed and how to undo it.

Do not clone, install, change Orca's settings, write files or start anything before step 4. If any check fails,
say so plainly in the plan and do not try to work around it.

## What orca-rice does (say this honestly in the plan)

Orca has no theme or plugin system for this, so orca-rice puts its look into Orca's **running** window:

- It switches on Node's inspector in Orca's main process (`SIGUSR1`) for about half a second, on `127.0.0.1:9229`,
  connects only if that port belongs to Orca's own process, leaves a small watcher there, and closes the inspector
  (on every path; the code it sends also closes it after 5 seconds). The watcher reads one data file and styles
  Orca's window. It is code running inside Orca, so it is all in this repo to read: `lib/orca.mjs`,
  `layer/rice-layer.js`, and the walk-through in `docs/how-it-works.md`. An Orca that has the inspector switched off
  is never signalled.
- **Orca's app files are never changed.** Quitting Orca removes the look (the terminal theme and the settings in the
  table below stay until `uninstall` or another theme). Orca's terminals keep running throughout.
- Before anything goes in, `lib/compat.mjs` reads the installed Orca to confirm everything orca-rice hooks onto is
  still there. A part whose hooks are gone is skipped, so Orca's own look shows there instead of a broken one.
- An Orca update can change what orca-rice hooks onto. `doctor` says what still works, and fixes ship as updates.

What it writes or changes:

| Where | What | Undone by |
|---|---|---|
| Orca's settings | terminal theme, terminal font (only if installed), the imported theme list, Background Opacity → 0 (so the scene shows through the terminal text), Left Sidebar → Match Terminal | `uninstall` puts back the copy saved in `~/.orca-rice/settings-backup.json` before the first change |
| `~/.warp/themes/orca-rice-*.yaml` | 22 theme files, the format Orca's own "Import from Warp" reads (Warp lists them too, if they use Warp) | `uninstall` |
| `~/.orca-rice/` | preferences, the data file, Orca's last report | `uninstall` |
| Orca's window storage | only if they park a draft with the chat's stash button: the parked drafts | `uninstall` (or clearing them from the stash) |
| `~/Library/LaunchAgents/local.orca-rice.ensure.plist` | only with `autostart on`: brings the look back within a minute after Orca restarts | `autostart off` or `uninstall` |
| Fonts | only if they agree: the theme's free font from Homebrew | `brew uninstall --cask <font>` |

The backup covers Orca's settings; the other rows are files orca-rice removes itself. `install --keep-settings` leaves
Background Opacity and the sidebar alone, but then the scene hides behind the opaque terminal text: mention it, do
not recommend it.

## Step 1: look (read only)

Run what your mode allows; if you cannot run commands, ask them to paste the output. Nothing here writes anything.

```sh
sw_vers -productVersion                                           # macOS only for now
/usr/bin/plutil -extract CFBundleShortVersionString raw /Applications/Orca.app/Contents/Info.plist
pgrep -x Orca >/dev/null && echo "Orca is running" || echo "Orca is not running"
node -v                                                           # 22+ is used; otherwise Orca's own Node is
lsof -nP -iTCP:9229 -sTCP:LISTEN                                  # free: prints nothing and exits 1 (that is the pass)
command -v brew                                                   # only needed for the optional fonts
```

These cannot see inside Orca. `bin/orca-rice check` can (does this Orca still allow what orca-rice hooks onto?), and
writes nothing at all, but it needs the repo on their Mac. So before approval you plan with the commands above, and
`check` is the plan's step 2, right after cloning. If it says "not ready", you stop there: the cloned folder is the
only change, and deleting it undoes it. If the repo is already on their Mac, run `check` (or `check --json`) now.

Stop and tell them if: it is not macOS; Orca is not in `/Applications`; port 9229 is held by any process other than
Orca's own (`pgrep -x Orca`); or `check` says Orca "no longer lets orca-rice in". Tested on macOS 27 (Apple
Silicon) with Orca 1.4.221; on other versions, go ahead when `check` says ready.

## Step 2: ask

- **Theme** (show them `docs/images/themes.png` or the README gallery):
  `tokyo-night` Rain city · `catppuccin` Moonlit rooftops · `kanagawa` The great wave ·
  `everforest` Firefly forest · `gruvbox` Desert dusk · `nord` Aurora fjord · `rose-pine` Dawn lake (light) ·
  `ristretto` Campfire · `osaka-jade` Bamboo moon · `ethereal` Floating isles · `hackerman` Signal rain (CRT) ·
  `retro-82` Night drive (CRT) · `lumon` Macrodata · `last-horizon` Planetrise · `miasma` Marsh lights ·
  `matte-black` Beacon · `solitude` Lighthouse · `vantablack` The void · `catppuccin-latte` Balloon morning (light) ·
  `flexoki-light` Ink mountains (light) · `lupine` Lupine meadow (light) · `white` Snowfield (light)
- **Scene**: `on` (moving, 10 frames a second), `dim` (quieter), `still` (one frame, the lightest on battery and GPU:
  suggest it if they care about smoothness), or `off`.
- **Shape**: `cards` (floating rounded cards, the look in the screenshots) or `square` (Orca's own layout, scene
  behind the terminals only).
- **Effects**: cursor trail, and scanlines on the two retro themes (on unless they say no; `--no-fx`).
- **Chat extras** (on unless they say no; `--no-chat`): in Orca's chat views, every reply of a finished turn left
  open, each turn's changed files, plans as cards, code colours, a copy button, image zoom, Quote / Ask / Copy on
  selected text, a draft stash, a welcome for new chats, and a comet over the composer while the agent works. They
  work from what Orca's window shows, and nothing is ever sent to an agent: Quote, Ask, the starters and the stash
  only put text in the composer for them to send.
- **Autostart**: Orca drops the look whenever it quits or updates. Yes means a small LaunchAgent; no means they run
  `bin/orca-rice ensure` after an Orca restart.
- **Font**: only if the theme's font is not installed yet (`check` says, once the repo is there; `bin/orca-rice
  themes` lists each theme's font): install it with Homebrew, or let Orca keep its own.
- **Where to keep the repo**: suggest `~/orca-rice`. autostart points at it, so it should stay put.

## Step 3: the plan (template)

> **Your Orca:** macOS …, Orca … (running), Node … (or Orca's own), port 9229 free. The deeper check runs at step 2.
>
> **You chose:** theme …, scene …, shape …, effects …, chat extras …, autostart …, font ….
>
> **I will:**
> 1. `git clone https://github.com/denonmaryland/orca-rice ~/orca-rice`
> 2. `~/orca-rice/bin/orca-rice check` (writes nothing; if it is not ready I stop here and tell you)
> 3. `~/orca-rice/bin/orca-rice install --theme … --scene … --shape …` (Orca must be open)
> 4. *(if chosen)* `~/orca-rice/bin/orca-rice autostart on`
> 5. *(if chosen)* `brew install --cask …`
> 6. `~/orca-rice/bin/orca-rice doctor`, and ask you to look at Orca
>
> **What changes:** (the table above, for their choices). **How it gets in:** Orca's inspector for half a second;
> Orca's files untouched (details: docs/how-it-works.md). **Undo:** with Orca open,
> `~/orca-rice/bin/orca-rice uninstall` takes it all out and restores your settings (if Orca is closed, open it
> first).

## Step 4: after they approve

Run the plan's steps one at a time and stop at the first error. After `install`, Orca changes within a second or
two: tell them what to expect (their theme's colours, the scene, the cards) and ask them to look. Finish with
`doctor` and a short summary: what changed, where the backup is, and the undo command.

Font notes: Orca uses a theme's font only when it is installed; installing one later needs `bin/orca-rice repair`
to pick it up.

## Later

| They want | Run |
|---|---|
| Another theme | `bin/orca-rice theme <id>` |
| Scene moving, quieter, still or gone | `bin/orca-rice scene on\|dim\|still\|off` |
| Cards or Orca's boxes | `bin/orca-rice shape cards\|square` |
| No cursor trail or CRT | `bin/orca-rice fx off` |
| Chat extras on or off | `bin/orca-rice chat on\|off` |
| A theme per project | `bin/orca-rice project set /path/to/project <id>` |
| The look is gone after Orca restarted | `bin/orca-rice ensure` (or `autostart on`) |
| Something looks wrong, or Orca updated | `bin/orca-rice doctor`, then `bin/orca-rice repair` |
| Update orca-rice | `git -C ~/orca-rice pull && ~/orca-rice/bin/orca-rice repair` |
| Remove it | `bin/orca-rice uninstall` (Orca open, so the settings go back; `--keep-settings` leaves them as they are and keeps the saved copy) |

## Troubleshooting

| `check` / `doctor` says | Meaning, and what to do |
|---|---|
| Orca is not running | Open Orca, run the command again. |
| port 9229 is in use | A debugger or another tool holds it. Close it; never kill Orca's processes. |
| no longer lets orca-rice in | That Orca version turned the inspector off. orca-rice cannot work there: `uninstall --keep-settings`, and tell them. |
| … paused (Orca changed …) | Orca renamed something orca-rice hooks onto. The rest works; report it (below). |
| Background Opacity is 1 / sidebar is … | `bin/orca-rice repair` sets them again. |
| theme not set: … not in Orca | `bin/orca-rice repair` (it rewrites the theme files and imports again). |
| older watcher | `bin/orca-rice repair`. |

## Never

- Never edit, patch or re-sign anything inside `Orca.app`, and never kill Orca or its terminal daemon (their
  running agents live there).
- Never run `install`, `repair`, `uninstall`, `autostart`, or `brew` without their approval.
- Never put their files, paths or terminal contents into an issue without asking.

## Reporting a problem

Open an issue at https://github.com/denonmaryland/orca-rice/issues with the output of `bin/orca-rice doctor` and
`bin/orca-rice check --json`, and what they saw. Those hold the Orca and macOS versions and what works; home folder
paths show as `~`. Let them read it over before it is posted.
