# Changelog

## 0.2.1

- First installs show each theme's own terminal colours and frame right away. Before, Orca's open window was not told
  about the themes orca-rice had just imported, so it kept Orca's stock dark terminal until Orca restarted: dark themes
  had a neutral frame, and light themes a dark grey one.
- `uninstall` puts back Background Opacity, the sidebar and the terminal themes on an Orca that had never set them
  (before, a fresh Orca was left with transparent, black terminals).
- AGENTS.md: a tip for light themes (Claude Code's own colours: `/theme`).
- Updating: `git pull`, then `bin/orca-rice repair` (the watcher changed).

## 0.2.0

- Orca's agent spinners turn again: 0.1.0 held them still (a rule meant to save repaints overrode their spin).
- Chat extras in Orca's chat views, on by default (`chat on|off`, `install --no-chat`): every reply of a finished
  turn left open, each turn's changed files, plans as cards, code in the theme's colours, a copy button on each reply,
  image zoom, Quote / Ask / Copy on selected text, a draft stash, a welcome for new chats, a comet over the composer
  while the agent works; in Orca's own chat agents, its model and effort pickers as chips, the context figures by its
  ring, and its raw event rows hidden.
- The composer's styling now reaches only the composer box (Orca marks the whole chat body the same way).
- `check` and `doctor` cover the chat view as a part of its own; an Orca checked by 0.1.0 is read again.
- Updating from 0.1.0: `git pull`, then `bin/orca-rice repair`. Checked against Orca 1.4.221.

## 0.1.0

First release: Omarchy's 22 themes, a pixel-art scene per theme (on, dim, still, off), floating
cards, the chat view in the theme's glass, agents lighting up the scene, project themes, a read-only `check`, settings
saved and restored, and an optional autostart. Checked against Orca 1.4.221.
