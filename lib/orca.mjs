// How orca-rice gets into Orca. Orca has no setting, stylesheet or plugin API for any of this, so the look goes into
// its running window: Node's inspector is switched on in Orca's main process (SIGUSR1, which Orca's Electron build
// leaves enabled; lib/compat.mjs checks), a small watcher is left there, and the inspector is closed again, all in
// about half a second. The watcher reads one data file (~/.orca-rice/look.json: the scene's GLSL, the colours, the
// shape, the name of Orca's terminal theme), hands it to layer/rice-layer.js in Orca's window, and switches the
// terminal theme through Orca's own settings channel. Orca's terminals run in its own terminal daemon, which is never
// signalled. Quitting Orca removes all of it; `ensure` (by hand, or `autostart on`) puts it back.
//
// Nothing here changes Orca's files. Before its first change to Orca's settings the watcher saves the ones it touches
// (~/.orca-rice/settings-backup.json), and `restore` puts them back.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describeCompat, firstTime, installedCompat, pendingCompat } from './compat.mjs'
import { lookOf } from './look.mjs'
import { BACKUP, FILE, LOCK, ORCA, PREFS, PROJECT_DATA, PROJECTS, STATE, STATUS } from './paths.mjs'
import { SCENE_MODES } from './scenes.mjs'
import { THEMES } from './themes.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LAYER_FILE = join(HERE, '..', 'layer', 'rice-layer.js')
const PORT = 9229

// The watcher's version: a newer one replaces the old at the next `ensure` or `install`
export const WATCHER_V = 2

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}
const writeJson = (path, data) => {
  mkdirSync(STATE, { recursive: true })
  writeFileSync(`${path}.tmp`, `${JSON.stringify(data, null, 2)}\n`)
  renameSync(`${path}.tmp`, path)
}

// ---------------------------------------------------------------------------
// What to show: the preferences, and the data file made from them

export const DEFAULT_PREFS = { theme: 'ethereal', mode: 'on', shape: 'cards', fx: true, chat: true }

export function prefs() {
  const p = { ...DEFAULT_PREFS, ...(readJson(PREFS) ?? {}) }
  if (!THEMES.some((t) => t.id === p.theme)) p.theme = DEFAULT_PREFS.theme
  if (!Object.hasOwn(SCENE_MODES, p.mode)) p.mode = DEFAULT_PREFS.mode
  if (p.shape !== 'square') p.shape = 'cards'
  p.fx = p.fx !== false
  p.chat = p.chat !== false
  return p
}

export function setPrefs(patch) {
  const next = { ...prefs(), ...patch }
  writeJson(PREFS, next)
  return next
}

export const themeOf = (id) => THEMES.find((t) => t.id === id) ?? null

// What the installed Orca takes (lib/compat.mjs; read again when Orca or the hook list changed); unknown, everything
function gates() {
  let c = null
  try {
    c = installedCompat()
  } catch {}
  if (!c) return {}
  return { cards: c.cards, theme: c.theme, lights: c.lights, chat: c.chat, fonts: !c.minor.some((m) => m.what.startsWith('terminal font')) }
}

export const enabled = () => existsSync(FILE)

// The data file for the current preferences (the watcher sees the change and shows it)
export function writeLook() {
  const p = prefs()
  writeJson(FILE, lookOf(themeOf(p.theme), { mode: p.mode, shape: p.shape, fx: p.fx, chat: p.chat, gates: gates() }))
  writeProjects()
  return p
}

// Per-project themes: while a project's tabs are in front, Orca shows its theme. projects.json maps a folder to a
// theme id; projects-look.json holds each one's look (no font: Orca has one font for every terminal), never kept
export function projectMap() {
  const m = readJson(PROJECTS)
  return m && typeof m === 'object' && !Array.isArray(m) ? m : {}
}

function writeProjects() {
  const p = prefs()
  const list = Object.entries(projectMap())
    .map(([prefix, id]) => [prefix, themeOf(id)])
    .filter(([prefix, t]) => prefix.startsWith('/') && t !== null)
    .map(([prefix, t]) => {
      const { font, ...rest } = lookOf(t, { mode: p.mode, shape: p.shape, fx: p.fx, chat: p.chat, keep: false, gates: gates() })
      return { prefix, theme: t.id, look: rest }
    })
  writeJson(PROJECT_DATA, list)
}

export function setProject(prefix, id) {
  const m = projectMap()
  if (id === null) delete m[prefix]
  else m[prefix] = id
  writeJson(PROJECTS, m)
  if (enabled()) writeProjects()
}

// ---------------------------------------------------------------------------
// Orca's main process, found exactly, and its inspector for as short a time as possible

export function orcaPid() {
  if (process.env.ORCA_RICE_TEST_PID) return Number(process.env.ORCA_RICE_TEST_PID)
  const rows = execFileSync('ps', ['-axo', 'pid=,ppid=,command=']).toString().split('\n')
  for (const row of rows) {
    const m = row.trim().match(/^(\d+)\s+1\s+(.*)$/)
    if (m && m[2] === ORCA) return Number(m[1])
  }
  return null
}

function listener() {
  try {
    return execFileSync('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t']).toString().trim()
  } catch {
    return ''
  }
}

// The inspector's WebSocket, opened within `ms` or not at all
function connect(url, ms) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const t = setTimeout(() => {
      try { ws.close() } catch {}
      reject(new Error('could not connect to Orca'))
    }, ms)
    ws.onopen = () => { clearTimeout(t); resolve(ws) }
    ws.onerror = () => { clearTimeout(t); reject(new Error('could not connect to Orca')) }
  })
}

// One inspector call, answered within `ms`, and failed at once if the connection closes
function call(ws, method, params, ms) {
  return new Promise((resolve, reject) => {
    const id = (call.id = (call.id ?? 0) + 1)
    const t = setTimeout(() => reject(new Error(`Orca did not answer within ${ms / 1000} s`)), ms)
    const onMessage = (m) => {
      const d = JSON.parse(m.data)
      if (d.id !== id) return
      clearTimeout(t)
      ws.removeEventListener('message', onMessage)
      resolve(d)
    }
    ws.addEventListener('message', onMessage)
    ws.addEventListener('close', () => { clearTimeout(t); reject(new Error('Orca closed the connection')) }, { once: true })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

const CLOSE = "process.getBuiltinModule('inspector').close()"

// Runs `expression` in Orca's main process: SIGUSR1, connect only if the listener is Orca itself, evaluate, close.
// The inspector is closed again on every path; the expression also closes it itself after 5 s
async function inOrca(pid, expression) {
  // An Orca whose inspector fuse is off would not open one, and SIGUSR1 could end it: never signalled
  const c = installedCompat()
  if (c !== null && !c.door) throw new Error(describeCompat(c.version, c, 'installed'))
  if (listener()) throw new Error(`port ${PORT} is in use by another process; nothing sent to Orca`)
  process.kill(pid, 'SIGUSR1')
  let url = null
  let ws = null
  let failure = null
  let value
  try {
    for (let i = 0; i < 40 && url === null; i++) {
      await sleep(100)
      if (listener() !== String(pid)) continue
      try {
        url = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json())[0]?.webSocketDebuggerUrl ?? null
      } catch {
        url = null
      }
    }
    if (url === null) throw new Error(`Orca's inspector did not open (listener: ${listener() || 'none'})`)
    ws = await connect(url, 3000).catch(() => connect(url, 3000))
    const guarded = `(() => { const i = process.getBuiltinModule('inspector'); setTimeout(() => i.close(), 5000).unref?.(); return ${expression} })()`
    const r = await call(ws, 'Runtime.evaluate', { expression: guarded, awaitPromise: true, returnByValue: true }, 20000)
    if (r.error) throw new Error(String(r.error.message ?? 'evaluation failed'))
    if (r.result?.exceptionDetails) throw new Error(String(r.result.exceptionDetails.exception?.description ?? 'evaluation failed').split('\n')[0])
    value = r.result?.result?.value
  } catch (err) {
    failure = err
  }
  // Closing: over the open connection, or a fresh one if it never opened
  if (url !== null) {
    try {
      if (ws === null || ws.readyState !== WebSocket.OPEN) ws = await connect(url, 2000)
      ws.send(JSON.stringify({ id: 999999, method: 'Runtime.evaluate', params: { expression: CLOSE } }))
      await sleep(300)
      ws.close()
    } catch {}
  }
  if (listener() === String(pid)) {
    const left = "Orca's inspector is still open on 127.0.0.1:9229: quit and reopen Orca to close it"
    failure = failure ? new Error(`${failure.message}; ${left}`) : new Error(left)
  }
  if (failure) throw failure
  return value
}

// ---------------------------------------------------------------------------
// The watcher: what stays in Orca's main process. It watches the data file, passes it to the layer in each Orca
// window (again after a reload) and writes a status file. Data in, never code: the look is checked and passed as a
// JSON literal

export function bootstrap() {
  const layer = readFileSync(LAYER_FILE, 'utf8')
  const lv = Number(/const V = (\d+)/.exec(layer)?.[1] ?? 0)
  return `(async () => {
  const fs = process.getBuiltinModule('fs'), path = process.getBuiltinModule('path')
  const { app, BrowserWindow, webContents } = process.getBuiltinModule('module').createRequire(process.execPath)('electron')
  const V = ${WATCHER_V}, LV = ${lv}, LAYER = ${JSON.stringify(layer)}
  const FILE = ${JSON.stringify(FILE)}, STATUS = ${JSON.stringify(STATUS)}, BACKUP = ${JSON.stringify(BACKUP)}, PROJECT_DATA = ${JSON.stringify(PROJECT_DATA)}
  const DIR = path.dirname(FILE)
  if (globalThis.__orcaRice) try { globalThis.__orcaRice.dispose(false) } catch {}
  const own = (wc) => !wc.isDestroyed() && wc.getType() === 'window' && /\\/out\\/renderer\\/index\\.html$/.test(wc.getURL().replace(/[?#].*$/, ''))
  // Every field checked: anything unexpected and the look is off
  const check = (p, keep) => {
    if (!p || !['on', 'dim', 'still', 'off'].includes(p.mode)) return { mode: 'off' }
    const bg = Array.isArray(p.bg) && p.bg.length === 3 && p.bg.every((n) => typeof n === 'number' && n >= 0 && n <= 1) ? p.bg : undefined
    const hex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)
    const name = typeof p.terminal === 'string' && p.terminal.length <= 80 && /^[\\w .()'&+-]+$/.test(p.terminal) ? p.terminal : undefined
    const font = typeof p.font === 'string' && /^[\\w .-]{1,64}$/.test(p.font) ? p.font : undefined
    const crt = typeof p.crt === 'number' && p.crt > 0 && p.crt <= 1 ? p.crt : 0
    const look = { bg, fg: hex(p.fg) ? p.fg : undefined, accent: Array.isArray(p.accent) && p.accent.length === 2 && p.accent.every(hex) ? p.accent : undefined, signal: Array.isArray(p.signal) && p.signal.length === 3 && p.signal.every(hex) ? p.signal : undefined, shape: p.shape === 'cards' ? 'cards' : 'square', terminal: name, font, keep, lights: p.lights !== false, trail: p.trail !== false, crt, chat: p.chat === true }
    if (p.mode === 'off') return { mode: 'off', theme: String(p.theme ?? '').slice(0, 40), ...look }
    const ok = typeof p.shader === 'string' && p.shader.length < 400000 && bg !== undefined
    return ok ? { mode: p.mode, theme: String(p.theme).slice(0, 40), shader: p.shader, ...look } : { mode: 'off' }
  }
  const read = () => {
    try { const p = JSON.parse(fs.readFileSync(FILE, 'utf8')); return check(p, p.keep !== false) } catch { return { mode: 'off' } }
  }
  // Per-project themes: the one whose folder holds the worktree in front (from the tab bar's data-worktree-id) wins
  const projects = () => {
    try {
      const list = JSON.parse(fs.readFileSync(PROJECT_DATA, 'utf8'))
      return Array.isArray(list) ? list.filter((e) => e && typeof e.prefix === 'string' && e.prefix.startsWith('/')).map((e) => ({ prefix: e.prefix, p: check(e.look, false) })) : []
    } catch { return [] }
  }
  let where = null
  const resolve = () => {
    if (where) {
      const hit = projects().filter((e) => where === e.prefix || where.startsWith(e.prefix.endsWith('/') ? e.prefix : e.prefix + '/')).sort((a, b) => b.prefix.length - a.prefix.length)[0]
      if (hit) return { p: hit.p, src: hit.prefix }
    }
    return { p: read(), src: 'kept' }
  }
  let current = null
  // Set when this watcher is replaced or taken out: a push still running stops before it changes anything
  let gone = false
  const status = {}
  const save = () => { try { fs.writeFileSync(STATUS + '.tmp', JSON.stringify({ pid: process.pid, v: V, at: Date.now(), ...status }, null, 2)); fs.renameSync(STATUS + '.tmp', STATUS) } catch {} }
  // Orca's settings as they were, saved once before the first change (restore puts them back)
  const BACKUP_READ = ${JSON.stringify(`window.api.settings.get().then((s) => ({ terminalThemeDark: s.terminalThemeDark, terminalThemeLight: s.terminalThemeLight,
    terminalFontFamily: s.terminalFontFamily, terminalBackgroundOpacity: s.terminalBackgroundOpacity, leftSidebarAppearanceMode: s.leftSidebarAppearanceMode,
    terminalCustomThemes: s.terminalCustomThemes }))`)}
  // One read for all windows (they share Orca's settings), finished before any of them changes anything
  let backingUp = null
  const backup = (wc) => {
    if (fs.existsSync(BACKUP)) return Promise.resolve()
    backingUp = backingUp || wc.executeJavaScript(BACKUP_READ).then((b) => {
      if (b && typeof b === 'object' && !fs.existsSync(BACKUP)) fs.writeFileSync(BACKUP, JSON.stringify({ at: Date.now(), settings: b }, null, 2))
    }).finally(() => { backingUp = null })
    return backingUp
  }
  // Orca's terminal theme, by the name it was imported under: its window's store takes it at once through the
  // settings:changed message Orca itself sends, and Orca saves it only when kept (a project's theme stays unsaved)
  const RESOLVE = ${JSON.stringify(`async (name, font) => {
    let s = await window.api.settings.get()
    let c = (s.terminalCustomThemes || []).find((x) => x.name === name)
    // Not in Orca yet: import it as Orca's own Import from Warp does (its parser reads ~/.warp/themes, no dialog),
    // merged by id with the themes already there
    if (!c && window.api.settings.previewWarpThemeImport) {
      const found = await window.api.settings.previewWarpThemeImport({ kind: 'auto' })
      const hit = (found && found.themes || []).find((x) => x.name === name)
      if (hit) {
        const { selectionValue, ...entry } = hit
        const all = new Map((s.terminalCustomThemes || []).map((x) => [x.id, x]))
        all.set(entry.id, entry)
        s = await window.api.settings.set({ terminalCustomThemes: [...all.values()] }) || await window.api.settings.get()
        c = (s.terminalCustomThemes || []).find((x) => x.name === name)
      }
    }
    if (!c) return { why: name + ' is not in Orca, and ~/.warp/themes has no theme of that name (orca-rice install writes them)' }
    const mode = s.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : s.theme
    const key = mode === 'light' && s.terminalUseSeparateLightTheme ? 'terminalThemeLight' : 'terminalThemeDark'
    // A font is used only if this Mac has it: text in it measures the same over two different fallbacks
    let fontOk = false
    if (font) {
      const g = document.createElement('canvas').getContext('2d'), w = (f) => { g.font = '16px ' + f; return g.measureText('mmmmmiiiiiWW00').width }
      fontOk = w('"' + font + '", serif') === w('"' + font + '", monospace') && w('"' + font + '", monospace') !== w('serif')
    }
    return { key, value: 'custom:' + c.id, saved: s[key], fontOk, savedFont: s.terminalFontFamily }
  }`)}
  const terminal = async (wc, p) => {
    if (!p.terminal) return
    const r = await wc.executeJavaScript('(' + RESOLVE + ')(' + JSON.stringify(p.terminal) + ', ' + JSON.stringify(p.font ?? null) + ')')
    if (!r || !r.key) { status.terminal = { name: p.terminal, ok: false, why: String(r && r.why || 'no answer').slice(0, 160), at: Date.now() }; return }
    // The theme's font with it, when this Mac has it (Orca refits every terminal to the new cell size)
    const patch = { [r.key]: r.value, ...(p.font && r.fontOk ? { terminalFontFamily: p.font } : {}) }
    if (gone) return
    wc.send('settings:changed', patch)
    if (p.keep && (r.saved !== r.value || (patch.terminalFontFamily && r.savedFont !== patch.terminalFontFamily))) {
      await wc.executeJavaScript('window.api.settings.set(' + JSON.stringify(patch) + ').then(() => true)')
    }
    status.terminal = { name: p.terminal, ok: true, kept: p.keep, font: p.font ? (r.fontOk ? p.font : 'not installed: ' + p.font) : null, at: Date.now() }
  }
  // The Orca settings the look relies on, as Orca has them (for doctor): read only
  const SETTINGS = ${JSON.stringify(`window.api.settings.get().then((s) => ({ opacity: s.terminalBackgroundOpacity, sidebar: s.leftSidebarAppearanceMode,
    imported: (s.terminalCustomThemes || []).map((x) => x.name), mode: s.theme, dark: s.terminalThemeDark, light: s.terminalThemeLight }))`)}
  // macOS's window buttons: Orca puts them at 16, 18z - 6 (the middle of its 36 px title row, at zoom z) and again on
  // every zoom change. In cards the row is a 32 px pill 8 px in, so they go to its middle, 24z - 6 both ways, and
  // Orca's own call is wrapped to do the same until the cards go (then they go back to Orca's place)
  const ours = (z) => { const c = Math.round(24 * z - 6); return { x: c, y: c } }
  const lights = (wc, cards) => {
    if (process.platform !== 'darwin') return
    const win = BrowserWindow.fromWebContents(wc)
    if (!win || win.isDestroyed() || typeof win.setWindowButtonPosition !== 'function') return
    if (cards) {
      if (!win.__riceLights) {
        const orcas = win.setWindowButtonPosition
        win.__riceLights = orcas
        // The zoom Orca's call was made for, exact from the page when the two agree (Orca's y is rounded)
        win.setWindowButtonPosition = function (at) {
          if (!at || typeof at.y !== 'number') return orcas.call(this, at)
          const z = (at.y + 6) / 18, page = wc.isDestroyed() ? z : wc.getZoomFactor()
          return orcas.call(this, ours(Math.abs(z - page) < 0.05 ? page : z))
        }
      }
      win.__riceLights.call(win, ours(wc.getZoomFactor()))
    } else if (win.__riceLights) {
      const orcas = win.__riceLights
      delete win.setWindowButtonPosition
      delete win.__riceLights
      orcas.call(win, { x: 16, y: Math.round(18 * wc.getZoomFactor() - 6) })
    }
  }
  const push = async (wc, p) => {
    if (!own(wc) || gone) return
    // No saved copy, no changes: the look still goes in, Orca's settings stay as they are
    let saved = true
    try { await backup(wc) } catch (e) { saved = false; status.backup = String(e && e.message || e).slice(0, 160) }
    if (!saved) p = { ...p, terminal: undefined }
    try { await terminal(wc, p) }
    catch (e) { status.terminal = { name: p.terminal, ok: false, why: String(e && e.message || e).slice(0, 160), at: Date.now() } }
    try { status.settings = await wc.executeJavaScript(SETTINGS) } catch { status.settings = null }
    // A push still running when this watcher is replaced stops here: the new one's look must not be undone
    if (gone) return
    try { status.window = await wc.executeJavaScript(LAYER + '\\n;window.__riceScene.apply(' + JSON.stringify(p) + ')'); status.error = null }
    catch (e) { status.error = String(e && e.message || e).slice(0, 300) }
    try {
      lights(wc, !!(status.window && status.window.cards) && p.lights !== false)
      const win = BrowserWindow.fromWebContents(wc)
      status.lights = win && typeof win.getWindowButtonPosition === 'function' ? win.getWindowButtonPosition() : null
    } catch (e) { status.lights = { error: String(e && e.message || e).slice(0, 160) } }
    if (!gone) save()
  }
  // One pass at a time, reading the file as it starts: switching themes quickly ends on the last one, in order
  let busy = false, again = false
  const pushAll = async () => {
    if (busy) { again = true; return }
    busy = true
    try {
      do {
        again = false
        const r = resolve()
        current = r.src
        const wins = webContents.getAllWebContents().filter(own)
        status.windows = wins.length
        if (wins.length === 0) { status.error = 'no Orca window found'; save() }
        await Promise.all(wins.map((wc) => push(wc, r.p)))
      } while (again)
    } finally { busy = false }
  }
  const loads = new Map()
  const hook = (wc) => {
    if (loads.has(wc)) return
    const f = () => { const r = resolve(); current = r.src; push(wc, r.p) }
    wc.on('did-finish-load', f); loads.set(wc, f)
    wc.once('destroyed', () => loads.delete(wc))
  }
  for (const wc of webContents.getAllWebContents()) hook(wc)
  const created = (_e, wc) => hook(wc)
  app.on('web-contents-created', created)
  let wait = 0
  const watcher = fs.watch(DIR, (_ev, name) => {
    if (name !== path.basename(FILE) && name !== path.basename(PROJECT_DATA)) return
    clearTimeout(wait); wait = setTimeout(pushAll, 60)
  })
  // Once a second: which worktree is in front (a project's theme may show), and whether the look in the window is
  // still this watcher's (a watcher this one replaced can have had a push in flight that lands after this one's)
  const WHERE = ${JSON.stringify(`(() => {
    const s = [...document.querySelectorAll('[data-tab-group-strip-id]')].find((e) => e.getBoundingClientRect().width > 0)
    return { id: s ? s.getAttribute('data-worktree-id') : null, lv: window.__riceScene ? window.__riceScene.v : null }
  })()`)}
  let healed = 0
  const look = setInterval(async () => {
    const wc = webContents.getAllWebContents().find(own)
    if (!wc || busy) return
    try {
      const got = await wc.executeJavaScript(WHERE)
      // An older layer in the window, or an older watcher's status in the file: pushed again, a few times at most,
      // so two watchers can never take turns
      let theirs = null
      try { theirs = JSON.parse(fs.readFileSync(STATUS, 'utf8')).v } catch {}
      const older = (got && typeof got.lv === 'number' && got.lv < LV) || (typeof theirs === 'number' && theirs < V)
      if (older && healed < 3) { healed++; pushAll(); return }
      const id = got && got.id
      where = typeof id === 'string' && id.includes('::') ? id.slice(id.indexOf('::') + 2) : null
      if (resolve().src !== current) pushAll()
    } catch {}
  }, 1000)
  look.unref?.()
  globalThis.__orcaRice = {
    v: V,
    dispose(clear = true) {
      gone = true
      watcher.close(); clearTimeout(wait); clearInterval(beat); clearInterval(look); app.off('web-contents-created', created)
      for (const [wc, f] of loads) if (!wc.isDestroyed()) {
        wc.off('did-finish-load', f)
        try { lights(wc, false) } catch {}
        if (clear) wc.executeJavaScript('window.__riceScene && window.__riceScene.dispose()').catch(() => {})
      }
      loads.clear(); delete globalThis.__orcaRice
      if (clear) try { fs.unlinkSync(STATUS) } catch {}
    },
  }
  // A heartbeat: the status file's time says this watcher is alive. When Orca restarts (for an update, say) it
  // stops, and the next \`ensure\` puts the watcher back
  const beat = setInterval(() => { try { const now = new Date(); fs.utimesSync(STATUS, now, now) } catch {} }, 15000)
  beat.unref?.()
  status.hooked = true
  pushAll()
  return JSON.stringify({ ok: true, pid: process.pid })
})()`
}

// This version's report: the watcher being replaced answers a fresh data file too, and must not count
async function waitStatus(since) {
  for (let i = 0; i < 40; i++) {
    const s = readJson(STATUS)
    if (s && s.at >= since && s.v >= WATCHER_V && (s.window || s.error)) return s
    await sleep(100)
  }
  return readJson(STATUS)
}

// In this Orca run, this version or newer, and beating (a watcher that went quiet counts as gone)
export const hooked = (pid) => {
  const s = readJson(STATUS)
  if (s === null || s.pid !== pid || !(s.v >= WATCHER_V) || s.hooked !== true) return false
  return Date.now() - statSync(STATUS).mtimeMs < 45_000
}

// The watcher into this Orca run, once: a lock so that two runs at the same moment send one signal between them
async function hook(pid, since) {
  mkdirSync(STATE, { recursive: true })
  try {
    mkdirSync(LOCK)
  } catch {
    // Another run is at it; a lock older than 20 s is left over from a crash
    if (Date.now() - statSync(LOCK).mtimeMs < 20_000) return null
    rmdirSync(LOCK)
    mkdirSync(LOCK)
  }
  try {
    if (hooked(pid)) return readJson(STATUS)
    // Parsed here first (never run): code that would not even parse never reaches Orca
    const code = bootstrap()
    new Function(`return ${code}`)
    await inOrca(pid, code)
    return await waitStatus(since)
  } finally {
    rmdirSync(LOCK)
  }
}

// Put the look in now (the data file must be written first). Returns the watcher's report, or null when another run
// is putting it in at this moment
export async function putIn({ force = false } = {}) {
  const pid = orcaPid()
  if (pid === null) throw new Error('Orca is not running: open it, then run this again')
  const since = Date.now()
  if (!force && hooked(pid)) {
    // Already watching in this Orca run: the data file's change is enough
    return waitStatus(since)
  }
  if (force && existsSync(STATUS)) unlinkSync(STATUS)
  return hook(pid, since)
}

// After a change of preferences: the data file rewritten, and Orca's report on it (the watcher put back first if Orca
// restarted since). Null when Orca is not running
export async function refresh() {
  const since = Date.now()
  writeLook()
  const pid = orcaPid()
  if (pid === null) return null
  if (hooked(pid)) return waitStatus(since)
  return hook(pid, since)
}

// Enabled, Orca running and no watcher in this run (Orca restarted or updated, or orca-rice is newer): put it in.
// A new Orca version is checked first and what it cannot take is left out of the data file; an update Orca has
// downloaded is checked before it is installed. Lines starting `notice:` are each told once. Quiet otherwise
export async function ensure() {
  if (!enabled()) return null
  const pid = orcaPid()
  if (pid === null) return null
  const out = []
  const tell = (c, when) => {
    if (c && firstTime(`${when}:${c.version}:${c.file ?? ''}`)) out.push(`notice: ${describeCompat(c.version, c, when)}`)
  }
  let c = null
  try {
    c = installedCompat()
    tell(c, 'installed')
    // What a newly installed Orca cannot take comes out of the data file before the watcher reads it
    if (c?.fresh) writeLook()
  } catch (err) {
    out.push(`orca check: ${String(err.message ?? err)}`)
  }
  // An Orca that no longer lets the watcher in is not signalled at all
  if (!hooked(pid) && c?.door !== false) {
    const s = await hook(pid, Date.now())
    if (s !== null) out.push(describe(s))
  }
  try {
    tell(pendingCompat(), 'pending')
  } catch (err) {
    out.push(`orca update check: ${String(err.message ?? err)}`)
  }
  return out.length > 0 ? out.join('\n') : null
}

// Orca settings through Orca's own settings channel, the way the watcher sets the terminal theme. Only these keys
const SETTABLE = {
  terminalBackgroundOpacity: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  leftSidebarAppearanceMode: (v) => typeof v === 'string' && /^[a-z-]{1,32}$/.test(v),
}

export function settingsCode(patch) {
  for (const [k, v] of Object.entries(patch)) if (!SETTABLE[k]?.(v)) throw new Error(`orca-rice does not set ${k}=${v}`)
  const json = JSON.stringify(patch)
  return `(async () => {
  const { webContents } = process.getBuiltinModule('module').createRequire(process.execPath)('electron')
  const wcs = webContents.getAllWebContents().filter((wc) => !wc.isDestroyed() && wc.getType() === 'window' && /\\/out\\/renderer\\/index\\.html$/.test(wc.getURL().replace(/[?#].*$/, '')))
  if (wcs.length === 0) return 'no Orca window found'
  for (const wc of wcs) wc.send('settings:changed', ${json})
  await wcs[0].executeJavaScript('window.api.settings.set(' + ${JSON.stringify(json)} + ').then(() => true)')
  return 'set ' + ${JSON.stringify(Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(' '))}
})()`
}

export async function setSettings(patch) {
  const code = settingsCode(patch)
  const pid = orcaPid()
  if (pid === null) throw new Error('Orca is not running')
  return inOrca(pid, code)
}

// Takes the look out of Orca and, with `restoreSettings`, puts back the settings saved before orca-rice's first change
// (terminal theme, font, Background Opacity, sidebar appearance, the imported theme list)
export function takeOutCode(saved) {
  const patch = saved ? Object.fromEntries(Object.entries(saved).filter(([, v]) => v !== undefined && v !== null)) : null
  const json = JSON.stringify(patch)
  return `(async () => {
  if (globalThis.__orcaRice) globalThis.__orcaRice.dispose(true)
  const { webContents } = process.getBuiltinModule('module').createRequire(process.execPath)('electron')
  const wcs = webContents.getAllWebContents().filter((wc) => !wc.isDestroyed() && wc.getType() === 'window' && /\\/out\\/renderer\\/index\\.html$/.test(wc.getURL().replace(/[?#].*$/, '')))
  // The look out, and the drafts parked with the chat's stash (window storage, kept only for orca-rice's stash button)
  const out = 'window.__riceScene && window.__riceScene.dispose(); try { for (const k of Object.keys(localStorage)) if (k.startsWith("rice-stash:")) localStorage.removeItem(k) } catch {} true'
  for (const wc of wcs) await wc.executeJavaScript(out).catch(() => {})
  const patch = ${json}
  if (patch && wcs.length > 0) {
    for (const wc of wcs) wc.send('settings:changed', patch)
    await wcs[0].executeJavaScript('window.api.settings.set(' + JSON.stringify(patch) + ').then(() => true)')
    return 'look out; settings restored'
  }
  return patch ? 'look out; no Orca window to restore the settings in' : 'look out'
})()`
}

export async function takeOut({ restoreSettings = true } = {}) {
  const pid = orcaPid()
  if (pid === null) throw new Error('Orca is not running: open it, then run this again (the settings are restored inside Orca)')
  return inOrca(pid, takeOutCode(restoreSettings ? readJson(BACKUP)?.settings ?? null : null))
}

// ---------------------------------------------------------------------------
// Reports

export function describe(s) {
  if (!s) return 'no report from Orca'
  if (!(s.v >= WATCHER_V)) return `Orca still reports an older watcher (v${s.v ?? '?'}): run orca-rice repair`
  if (s.error) return `Orca: ${s.error}`
  const w = s.window ?? {}
  if (w.mode === 'off') return `in Orca: scene off${w.cards ? ', floating cards' : ''}${w.sidebar ? ', sidebar in the terminal colours' : ''}${w.chat ? ', chat extras' : ''}`
  const parts = [`in Orca: ${w.theme ?? '?'} scene ${w.drawn ? 'drawn' : 'waiting'}${w.mode === 'still' ? ' (still)' : w.mode === 'dim' ? ' (dim)' : ''}`]
  if (w.error) parts.push(`shader: ${w.error}`)
  if (w.opaque) parts.push("the terminal text area hides the scene (Orca's Background Opacity is 1): orca-rice repair sets it to 0")
  // (Terminals wider than their tiles are left to doctor: just after a font change Orca has not refitted them yet)
  if (w.cards) parts.push('floating cards')
  if (w.chat) parts.push('chat extras')
  return parts.join('; ')
}

// Everything, a line each (✓ fine, ! needs a look): this Orca, any downloaded update, the look, the settings
export async function doctor() {
  const lines = []
  const say = (ok, text) => lines.push(`${ok ? '✓' : '!'} ${text}`)
  const c = installedCompat()
  if (c === null) return `! Orca was not found at ${ORCA}`
  const parts = ['scene', 'cards', 'theme', 'lights', 'chat'].filter((p) => !c[p])
  say(c.door && parts.length === 0, describeCompat(c.version, c, 'installed'))
  let p = null
  try {
    p = pendingCompat()
  } catch (err) {
    say(false, `the downloaded Orca update could not be read: ${String(err.message ?? err)}`)
  }
  if (p !== null) say(p.door && p.scene && p.cards && p.theme && p.lights && p.chat, describeCompat(p.version, p, 'pending'))
  if (!enabled()) {
    say(false, 'orca-rice is not installed here (orca-rice install)')
    return lines.join('\n')
  }
  const pid = orcaPid()
  if (pid === null) {
    say(false, 'Orca is not running: open it and run orca-rice doctor again')
    return lines.join('\n')
  }
  if (!c.door) return lines.join('\n')
  const since = Date.now()
  const wasIn = hooked(pid)
  // A fresh report either way: the watcher pushes the data file again when it is rewritten
  if (wasIn) writeLook()
  else await hook(pid, since)
  const s = await waitStatus(since)
  if (!s || s.pid !== pid || s.error) {
    say(false, `the look is not in: ${s?.error ?? 'no answer from Orca'}`)
    return lines.join('\n')
  }
  const w = s.window ?? {}
  const pr = prefs()
  say(true, `${wasIn ? 'the look is in' : 'the look was out (Orca restarted or updated): put back'} (watcher v${s.v}, Orca pid ${pid})`)
  if (w.mode !== 'off') say(w.drawn === true, w.drawn ? `${w.theme} scene drawn (${pr.mode})` : 'the scene is not drawn yet (no terminal on screen?)')
  else say(true, 'scenes off (orca-rice scene on)')
  if (pr.shape === 'cards') say(w.cards === true, w.cards ? 'floating cards on' : "floating cards off: Orca's own boxes show")
  if (w.cards) {
    const at = s.lights
    say(at?.x === at?.y && at?.x > 16, at ? `window buttons centred in the title pill (${at.x}, ${at.y})` : 'window buttons: no position reported')
  }
  if (pr.chat) say(w.chat === true, w.chat ? 'chat extras on' : `chat extras off: ${readJson(FILE)?.chat === false ? 'this Orca changed its chat view (doctor\'s first line says what)' : 'not reported by Orca'}`)
  else say(true, 'chat extras off (orca-rice chat on)')
  if (w.overflow) say(false, `${w.overflow} terminal${w.overflow === 1 ? ' is' : 's are'} wider than ${w.overflow === 1 ? 'its tile' : 'their tiles'}: resize the window once`)
  const want = readJson(FILE)?.terminal
  if (want === undefined) say(false, "background theme switching is paused for this Orca version: pick the theme in Orca's Settings › Terminal")
  else say(s.terminal?.ok === true, s.terminal?.ok ? `Orca's terminal theme: ${want}` : `Orca's terminal theme not set: ${s.terminal?.why ?? 'no answer'}`)
  const font = s.terminal?.font
  if (font) say(!font.startsWith('not installed'), font.startsWith('not installed') ? `font ${font.slice(15)} is not installed (orca-rice fonts)` : `font: ${font}`)
  const st = s.settings
  if (st) {
    say(st.opacity === 0 || w.mode === 'off', st.opacity === 0 ? 'Background Opacity 0: the scene shows through the text' : `Background Opacity is ${st.opacity}: the scene hides behind the text (orca-rice repair sets 0)`)
    say(st.sidebar === 'match-terminal', st.sidebar === 'match-terminal' ? 'sidebar matches the terminal' : `sidebar appearance is ${st.sidebar} (orca-rice repair sets Match Terminal)`)
  }
  say(existsSync(BACKUP), existsSync(BACKUP) ? 'your earlier Orca settings are saved (orca-rice uninstall restores them)' : 'no saved copy of your earlier Orca settings yet')
  const proj = Object.entries(projectMap())
  if (proj.length > 0) say(true, `project themes: ${proj.map(([f, t]) => `${f.split('/').pop()} → ${t}`).join(', ')}`)
  const age = Math.round((Date.now() - statSync(STATUS).mtimeMs) / 1000)
  say(age < 45, age < 45 ? `heartbeat ${age} s ago` : `no heartbeat for ${age} s`)
  return lines.join('\n')
}

export const statusOf = () => readJson(STATUS)
export const backupExists = () => existsSync(BACKUP)
