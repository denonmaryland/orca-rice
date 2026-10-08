// What orca-rice's look hooks onto in Orca, part by part, checked against the installed Orca (and an update Orca
// has downloaded but not installed yet) before anything goes in. A part whose hooks are gone is left out whole, so
// Orca's own look shows there instead of a half-styled one; a minor hook gone costs only a detail. Read only: Orca's
// files are never changed. Results are kept by version in ~/.orca-rice/compat.json, so an Orca is read once.

import { execFileSync } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

import { APP, COMPAT as CACHE, PENDING, STATE } from './paths.mjs'

// On Orca's own Node (Electron), app.asar would read as a folder; it is read here as the file it is
if (process.versions.electron) process.noAsar = true

const FRAMEWORK = 'Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework'
// Electron's fuse wire follows this marker in its framework: a version byte, a length byte, a byte per fuse
const SENTINEL = Buffer.from('dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX')
// RunAsNode: lets bin/orca-rice use Orca's own Node when there is no Node 22 on this Mac
export const RUN_AS_NODE_FUSE = 0

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function save(cache) {
  mkdirSync(STATE, { recursive: true })
  writeFileSync(`${CACHE}.tmp`, `${JSON.stringify(cache, null, 2)}\n`)
  renameSync(`${CACHE}.tmp`, CACHE)
}

// The watcher's way in (Node's inspector on SIGUSR1); the card look (frame, tiles, pills); the scene under the
// terminals; Orca's terminal theme switched in the background; macOS's window buttons centred in the title pill; the
// extras in Orca's chat views
export const ORCA_HOOKS = [
  { part: 'scene', in: 'renderer', what: 'terminal area (data-retained-pane-host)', find: 'data-retained-pane-host' },
  { part: 'scene', in: 'renderer', what: 'pane layout (data-terminal-layout-leaf-ids)', find: 'data-terminal-layout-leaf-ids' },
  { part: 'scene', in: 'renderer', what: 'terminal box (xterm-container)', find: 'xterm-container' },
  { part: 'scene', in: 'main', what: "Orca's window page (out/renderer/index.html)", find: 'renderer/index.html' },
  { part: 'cards', in: 'renderer', what: 'app frame (app-layout)', find: 'app-layout' },
  { part: 'cards', in: 'renderer', what: 'sidebar title row (titlebar-left)', find: 'titlebar-left' },
  { part: 'cards', in: 'renderer', what: 'tab bars (data-tab-group-strip-id)', find: 'data-tab-group-strip-id' },
  { part: 'cards', in: 'renderer', what: 'tabs (data-tab-id)', find: 'data-tab-id' },
  { part: 'cards', in: 'renderer', what: 'strip above the tabs (data-terminal-focus-release-surface)', find: 'data-terminal-focus-release-surface' },
  { part: 'cards', in: 'renderer', what: 'status bar (--bg-titlebar)', find: '--bg-titlebar' },
  { part: 'cards', in: 'renderer', what: 'sidebar colours (--worktree-sidebar-foreground)', find: '--worktree-sidebar-foreground' },
  { part: 'cards', in: 'renderer', what: 'collapsed title row (--collapsed-sidebar-header-width)', find: '--collapsed-sidebar-header-width', minor: true },
  { part: 'cards', in: 'renderer', what: 'pane buttons (pane-title-overlay-layer)', find: 'pane-title-overlay-layer', minor: true },
  { part: 'cards', in: 'renderer', what: 'pane button colours (--orca-pane-title-bg)', find: '--orca-pane-title-bg', minor: true },
  { part: 'cards', in: 'renderer', what: 'pane button row (pane-title-actions)', find: 'pane-title-actions', minor: true },
  { part: 'cards', in: 'renderer', what: 'split pane gaps (pane-divider)', find: 'pane-divider', minor: true },
  { part: 'cards', in: 'renderer', what: 'tab group gaps (tab-group-split-resize-handle)', find: 'tab-group-split-resize-handle', minor: true },
  { part: 'cards', in: 'renderer', what: 'sidebar footer rule (border-worktree-sidebar-border)', find: 'border-worktree-sidebar-border', minor: true },
  { part: 'cards', in: 'renderer', what: 'scrollbar handle (xterm-slider)', find: 'xterm-slider', minor: true },
  { part: 'theme', in: 'preload', what: 'settings channel (window.api)', find: 'exposeInMainWorld("api"' },
  { part: 'theme', in: 'preload', what: 'settings in window.api', find: 'settings: settingsApi' },
  { part: 'theme', in: 'preload', what: 'settings:get', find: '"settings:get"' },
  { part: 'theme', in: 'preload', what: 'settings:set', find: '"settings:set"' },
  { part: 'theme', in: 'preload', what: 'settings:changed', find: '"settings:changed"' },
  { part: 'theme', in: 'renderer', what: "the window's settings listener", find: 'settings.onChanged(' },
  { part: 'theme', in: 'renderer', what: 'imported themes (terminalCustomThemes)', find: 'terminalCustomThemes' },
  { part: 'theme', in: 'renderer', what: 'dark theme setting (terminalThemeDark)', find: 'terminalThemeDark' },
  { part: 'theme', in: 'renderer', what: 'light theme setting (terminalThemeLight)', find: 'terminalThemeLight' },
  { part: 'theme', in: 'renderer', what: 'separate light theme (terminalUseSeparateLightTheme)', find: 'terminalUseSeparateLightTheme' },
  { part: 'theme', in: 'renderer', what: 'imported theme ids (custom:)', find: '`custom:`' },
  { part: 'theme', in: 'renderer', what: 'terminal font setting (terminalFontFamily)', find: 'terminalFontFamily', minor: true },
  { part: 'lights', in: 'main', what: 'window buttons at 16, 12', find: /trafficLightPosition:\{x:16,y:12\}/ },
  { part: 'lights', in: 'main', what: "Orca's call that moves them", find: /setWindowButtonPosition\(\{x:16,y:\w+\}\)/ },
  { part: 'lights', in: 'main', what: 'their place per zoom (18z - 6)', find: /Math\.round\(18\*\w+-6\)/ },
  { part: 'chat', in: 'renderer', what: 'chat view (data-native-chat-root)', find: 'data-native-chat-root' },
  { part: 'chat', in: 'renderer', what: 'chat rows (data-native-chat-window)', find: 'data-native-chat-window' },
  { part: 'chat', in: 'renderer', what: 'chat composer (data-native-file-drop-target)', find: 'data-native-file-drop-target' },
  { part: 'chat', in: 'renderer', what: 'agent at work (data-native-chat-working)', find: 'data-native-chat-working' },
  { part: 'chat', in: 'renderer', what: "a turn's end (data-native-chat-turn-status)", find: 'data-native-chat-turn-status' },
  { part: 'chat', in: 'renderer', what: 'opening turns (onToggleExpandedTurn)', find: 'onToggleExpandedTurn', minor: true },
  { part: 'chat', in: 'renderer', what: "Orca's own chat agents (data-structured-agent-session-overlay-tab-id)", find: 'data-structured-agent-session-overlay-tab-id', minor: true },
  { part: 'chat', in: 'renderer', what: 'context ring (data-native-chat-context-usage)', find: 'data-native-chat-context-usage', minor: true },
  { part: 'chat', in: 'renderer', what: 'terminal chat views (native-chat-pane-shell)', find: 'native-chat-pane-shell', minor: true },
  { part: 'chat', in: 'renderer', what: 'new chat welcome (Start a chat with)', find: 'Start a chat with ', minor: true },
]

// Bumped whenever the hooks above change, so an Orca checked against an older list is read again
const HOOKS_V = 2

// EnableNodeCliInspectArguments: off also turns off the inspector on SIGUSR1
const INSPECT_FUSE = 3

export function checkOrca(src) {
  const missing = []
  const minor = []
  // An unreadable wire is not a closed door: the watcher's own attempt says
  const door = src.fuses.length <= INSPECT_FUSE || src.fuses[INSPECT_FUSE] === '1'
  if (!door) missing.push({ part: 'door', what: "Node's inspector (fuse EnableNodeCliInspectArguments off)" })
  for (const h of ORCA_HOOKS) {
    const text = src[h.in]
    const found = typeof h.find === 'string' ? text.includes(h.find) : h.find.test(text)
    if (!found) (h.minor === true ? minor : missing).push({ part: h.part, what: h.what })
  }
  const ok = (part) => !missing.some((m) => m.part === part)
  const scene = door && ok('scene')
  const cards = scene && ok('cards')
  return { door, scene, cards, theme: door && ok('theme'), lights: cards && ok('lights'), chat: door && ok('chat'), missing, minor, fuses: src.fuses }
}

// One line for a person: what still works, what is paused and why; for a downloaded update, what installing it does
export function describeCompat(version, c, when = 'installed') {
  const name = when === 'pending' ? `Orca ${version} (downloaded, not installed yet)` : `Orca ${version}`
  if (!c.door) {
    const off = "scenes, cards, background theme switching and the chat extras off, Orca's own look showing"
    return when === 'pending' ? `${name}: installing it would leave ${off} (it no longer lets orca-rice in)` : `${name} no longer lets orca-rice in: ${off}`
  }
  const names = { scene: 'the scene', cards: 'the card look', theme: 'background theme switching', lights: 'the centred window buttons', chat: 'the chat extras' }
  const paused = ['scene', 'cards', 'theme', 'lights', 'chat'].filter((p) => !c[p])
  const details = c.minor.length > 0 ? `; details off: ${c.minor.map((m) => m.what).join(', ')}` : ''
  if (paused.length === 0) return `${name}: everything orca-rice's look hooks onto is there${when === 'pending' ? ', safe to install' : ''}${details}`
  const list = paused.map((p) => names[p]).join(', ')
  const why = c.missing.filter((m) => paused.includes(m.part)).map((m) => m.what).join(', ')
  return when === 'pending'
    ? `${name}: installing it pauses ${list} (Orca changed ${why}); the rest keeps working${details}`
    : `${name}: ${list} paused (Orca changed ${why}); the rest works, Orca's own look shows there${details}`
}

// ---------------------------------------------------------------------------
// Reading an Orca: its version, its fuse wire and its bundled code, straight out of the app

export function appVersion(app = APP) {
  try {
    return execFileSync('/usr/bin/plutil', ['-extract', 'CFBundleShortVersionString', 'raw', join(app, 'Contents', 'Info.plist')]).toString().trim()
  } catch {
    return null
  }
}

// Read in 8 MB steps that overlap, so the marker is found whole wherever it falls
function fuses(framework) {
  if (!existsSync(framework)) return ''
  const fd = openSync(framework, 'r')
  try {
    const size = statSync(framework).size
    const chunk = Buffer.alloc(8 << 20)
    for (let pos = 0; pos < size; pos += chunk.length - 64) {
      const n = readSync(fd, chunk, 0, chunk.length, pos)
      const i = chunk.subarray(0, n).indexOf(SENTINEL)
      if (i >= 0 && i <= n - 64) {
        const at = i + SENTINEL.length
        return chunk.subarray(at + 2, at + 2 + chunk[at + 1]).toString('latin1')
      }
      if (n < chunk.length) break
    }
    return ''
  } finally {
    closeSync(fd)
  }
}

// Orca's bundled code by process, straight out of app.asar (its header names each file's place)
function asarParts(asar) {
  const fd = openSync(asar, 'r')
  try {
    const head = Buffer.alloc(16)
    readSync(fd, head, 0, 16, 0)
    const json = Buffer.alloc(head.readUInt32LE(12))
    readSync(fd, json, 0, json.length, 16)
    const base = 8 + head.readUInt32LE(4)
    const parts = { main: '', preload: '', renderer: '' }
    const walk = (node, pre) => {
      for (const [name, entry] of Object.entries(node.files ?? {})) {
        const path = `${pre}/${name}`
        if (entry.files) {
          walk(entry, path)
          continue
        }
        const part = /^\/out\/(main|preload|renderer)\//.exec(path)?.[1]
        if (part === undefined || entry.unpacked || !/\.(m?js|css|html)$/.test(path)) continue
        const text = Buffer.alloc(entry.size)
        readSync(fd, text, 0, entry.size, base + Number(entry.offset))
        parts[part] += text.toString()
      }
    }
    walk(JSON.parse(json.toString()), '')
    return parts
  } finally {
    closeSync(fd)
  }
}

function checkApp(app) {
  const version = appVersion(app)
  if (version === null) throw new Error(`${app}: not an Orca.app`)
  const c = checkOrca({ fuses: fuses(join(app, FRAMEWORK)), ...asarParts(join(app, 'Contents', 'Resources', 'app.asar')) })
  return { version, ...c }
}

// An update's zip: only the three files the check reads, into a folder of its own, removed after
function checkZip(zip) {
  const dir = mkdtempSync(join(tmpdir(), 'orca-rice-check-'))
  try {
    execFileSync('unzip', ['-q', '-o', zip, 'Orca.app/Contents/Info.plist', 'Orca.app/Contents/Resources/app.asar', `Orca.app/${FRAMEWORK}`, '-d', dir], { stdio: 'pipe' })
    return checkApp(join(dir, 'Orca.app'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function checkPath(path) {
  return path.endsWith('.zip') ? checkZip(path) : checkApp(path)
}

const keep = ({ version, door, scene, cards, theme, lights, chat, missing, minor, fuses: wire }) => ({ version, door, scene, cards, theme, lights, chat, missing, minor, fuses: wire, hooks: HOOKS_V, at: Date.now() })

// The installed Orca's result: read again only when its version changed; `fresh` when it was read now. `write: false`
// reads without keeping the result (check changes nothing)
export function installedCompat({ write = true } = {}) {
  const version = appVersion()
  if (version === null) return null
  const cache = readJson(CACHE) ?? {}
  if (cache.installed?.version === version && cache.installed.hooks === HOOKS_V) return { ...cache.installed, fresh: false }
  const c = keep(checkApp(APP))
  if (write) save({ ...cache, installed: c })
  return { ...c, fresh: true }
}

// The update Orca downloaded and has not installed yet, if any: read once per downloaded file
export function pendingCompat({ write = true } = {}) {
  const info = readJson(join(PENDING, 'update-info.json'))
  const file = typeof info?.fileName === 'string' ? basename(info.fileName) : null
  const version = file?.match(/^Orca-(\d[\w.-]*?)-(?:arm64|x64|universal)/)?.[1] ?? null
  if (file === null || version === null || version === appVersion() || !existsSync(join(PENDING, file))) return null
  const cache = readJson(CACHE) ?? {}
  if (cache.pending?.file === file && cache.pending.hooks === HOOKS_V) return { ...cache.pending, fresh: false }
  // Its own version from inside the zip; the file's name is only how it is known again
  const c = { ...keep(checkZip(join(PENDING, file))), file }
  if (write) save({ ...readJson(CACHE), pending: c })
  return { ...c, fresh: true }
}

// True the first time for `key` (a version seen), so each finding is told once
export function firstTime(key) {
  const cache = readJson(CACHE) ?? {}
  const told = Array.isArray(cache.told) ? cache.told : []
  if (told.includes(key)) return false
  save({ ...cache, told: [...told, key].slice(-40) })
  return true
}
