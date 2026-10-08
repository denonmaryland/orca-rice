#!/usr/bin/env node
// orca-rice: themes, floating cards and pixel scenes for Orca (github.com/stablyai/orca). Run it through bin/orca-rice, which picks
// a Node to run on. `orca-rice help` lists the commands; AGENTS.md explains them for coding agents.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { autostartOff, autostartOn, autostartStatus } from '../lib/autostart.mjs'
import { describeCompat, installedCompat, pendingCompat, RUN_AS_NODE_FUSE } from '../lib/compat.mjs'
import {
  backupExists, describe, doctor, enabled, ensure, hooked, orcaPid, prefs, projectMap, putIn, refresh, setPrefs, setProject,
  setSettings, statusOf, takeOut, themeOf, writeLook,
} from '../lib/orca.mjs'
import { APP, BACKUP, COMPAT, FILE, LOCK, PREFS, PROJECT_DATA, PROJECTS, STATE, STATUS } from '../lib/paths.mjs'
import { SCENE_MODES } from '../lib/scenes.mjs'
import { DEFAULT_FONT, FONT_CASKS, THEMES } from '../lib/themes.mjs'
import { removeWarpThemes, writeWarpThemes } from '../lib/warp.mjs'

const HELP = `orca-rice: themes, floating cards and pixel scenes for Orca

Look before changing anything
  check [--json]             is this Mac ready? Changes nothing
  themes                     the 22 themes and their scenes
  status                     what is set, and what Orca reports
  doctor                     everything, a line each, after an Orca update or when something looks off

Set up and take down
  install [--theme <id>] [--scene on|dim|still|off] [--shape cards|square] [--no-fx] [--no-chat] [--keep-settings]
  uninstall [--keep-settings]   takes the look out and puts your earlier Orca settings back
  repair                     puts the look in afresh (after updating orca-rice, or when doctor says so)
  autostart on|off|status    bring the look back on its own after Orca restarts (a macOS LaunchAgent)

Change the look
  theme <id>                 another theme
  scene on|dim|still|off     the pixel scene: moving, quieter, one still frame (lightest), or none
  shape cards|square         floating rounded cards, or Orca's own boxes
  fx on|off                  the cursor trail, and the retro themes' CRT
  chat on|off                the extras in Orca's chat views (changed files, plan cards, code colours, copy, ...)
  project set <folder> <id> | project clear <folder> | project list   a theme per project
  fonts [--all]              the Homebrew command for the theme's font (installs nothing)
  ensure                     put the look back if Orca restarted (what autostart runs)`

const out = (s) => console.log(s)
const flag = (args, name) => args.includes(name)
const opt = (args, name) => {
  const eq = args.find((a) => a.startsWith(`${name}=`))
  if (eq !== undefined) return eq.slice(name.length + 1)
  const i = args.indexOf(name)
  if (i < 0) return undefined
  const v = args[i + 1]
  if (v === undefined || v.startsWith('--')) throw new Error(`${name} needs a value`)
  return v
}
const isMode = (m) => typeof m === 'string' && Object.hasOwn(SCENE_MODES, m)

// ---------------------------------------------------------------------------
// Fonts: a theme's font is used only when installed. This looks for its files; the watcher's own measurement in Orca
// has the last word

const FONT_FILES = { [DEFAULT_FONT]: ['JetBrainsMonoNerdFontMono', 'JetBrainsMonoNFM'] }
function fontInstalled(name) {
  const want = (FONT_FILES[name] ?? [name.replace(/\s+/g, '')]).map((s) => s.toLowerCase())
  for (const dir of [join(homedir(), 'Library', 'Fonts'), '/Library/Fonts', '/System/Library/Fonts']) {
    try {
      if (readdirSync(dir).some((f) => want.some((w) => f.replace(/[\s_-]+/g, '').toLowerCase().startsWith(w)))) return true
    } catch {}
  }
  return false
}

const casksFor = (themes) => [...new Set(themes.map((t) => FONT_CASKS[t.font]).filter(Boolean))]

// ---------------------------------------------------------------------------
// check: read only

function nodeInfo() {
  if (process.versions.electron) return { runtime: "Orca's built-in Node", version: process.versions.node }
  return { runtime: 'Node', version: process.versions.node }
}

function port9229() {
  try {
    const pid = execFileSync('lsof', ['-nP', '-iTCP:9229', '-sTCP:LISTEN', '-t']).toString().trim()
    return pid || null
  } catch {
    return null
  }
}

function checkReport() {
  const r = { ok: true, problems: [], notes: [] }
  r.macos = process.platform === 'darwin'
  if (!r.macos) {
    r.ok = false
    r.problems.push('orca-rice runs on macOS only for now')
    return r
  }
  try {
    r.macosVersion = execFileSync('sw_vers', ['-productVersion']).toString().trim()
  } catch {}
  const c = installedCompat({ write: false })
  r.orca = { app: APP, found: c !== null }
  if (c === null) {
    r.ok = false
    r.problems.push(`Orca was not found at ${APP}`)
  } else {
    r.orca = { ...r.orca, version: c.version, running: orcaPid() !== null, door: c.door, scene: c.scene, cards: c.cards, theme: c.theme, lights: c.lights, chat: c.chat,
      missing: c.missing.map((m) => `${m.part}: ${m.what}`), minor: c.minor.map((m) => m.what), summary: describeCompat(c.version, c, 'installed') }
    if (!c.door) {
      r.ok = false
      r.problems.push(r.orca.summary)
    } else if (!(c.scene && c.cards && c.theme && c.lights && c.chat)) r.notes.push(r.orca.summary)
    if (!r.orca.running) r.notes.push('Orca is not running: install needs it open')
    r.orca.builtInNode = c.fuses.length > RUN_AS_NODE_FUSE ? c.fuses[RUN_AS_NODE_FUSE] === '1' : null
    let p = null
    try {
      p = pendingCompat({ write: false })
    } catch {}
    if (p !== null) r.notes.push(describeCompat(p.version, p, 'pending'))
  }
  r.runtime = nodeInfo()
  const busy = port9229()
  r.port9229 = busy === null ? 'free' : `in use by process ${busy}`
  if (busy !== null && busy !== String(orcaPid())) {
    r.ok = false
    r.problems.push(`port 9229 is in use by process ${busy} (a debugger or another tool): orca-rice uses it for half a second while it installs, so close that first`)
  }
  r.installed = enabled()
  r.prefs = prefs()
  const t = themeOf(r.prefs.theme)
  r.font = { theme: t.id, font: t.font, installed: fontInstalled(t.font), cask: FONT_CASKS[t.font] ?? null }
  try {
    execFileSync('brew', ['--version'], { stdio: 'ignore' })
    r.homebrew = true
  } catch {
    r.homebrew = false
  }
  r.autostart = autostartStatus()
  r.warpThemesDir = join(homedir(), '.warp', 'themes')
  return r
}

function printCheck(r) {
  const say = (ok, text) => out(`${ok ? '✓' : '!'} ${text}`)
  if (!r.macos) return say(false, r.problems[0])
  say(true, `macOS ${r.macosVersion ?? ''}`.trim())
  if (!r.orca.found) say(false, `Orca not found at ${r.orca.app}`)
  else {
    say(r.orca.door && r.orca.scene && r.orca.cards && r.orca.theme && r.orca.lights && r.orca.chat, r.orca.summary)
    say(r.orca.running, r.orca.running ? 'Orca is running' : 'Orca is not running (install needs it open)')
  }
  say(true, `runs on ${r.runtime.runtime} ${r.runtime.version}`)
  if (r.port9229 === 'free') say(true, 'port 9229 is free')
  for (const p of r.problems.filter((x) => !x.startsWith('Orca') && !x.startsWith('macOS'))) say(false, p)
  say(true, r.installed ? `installed: ${r.prefs.theme}, scene ${r.prefs.mode}, ${r.prefs.shape}` : 'not installed yet')
  say(r.font.installed, r.font.installed ? `font ${r.font.font} is installed` : `font ${r.font.font} is not installed (optional${r.homebrew && r.font.cask ? `: brew install --cask ${r.font.cask}` : ''})`)
  say(true, r.autostart.installed ? 'autostart is on' : 'autostart is off')
  out(r.ok ? 'ready: nothing was changed' : 'not ready: nothing was changed')
}

// ---------------------------------------------------------------------------

function preflight() {
  const r = checkReport()
  if (!r.ok) throw new Error(r.problems.join('; '))
  if (!r.orca.running) throw new Error('Orca is not running: open it, then run this again (nothing was changed)')
  return r
}

// After a change: what Orca shows now
async function changed(what) {
  if (!enabled()) return out(`${what} saved; orca-rice is not installed yet (orca-rice install)`)
  const s = await refresh()
  out(s === null ? `${what} saved; Orca is not running, it shows when Orca is open and the look is in (orca-rice ensure)` : `${what}. ${describe(s)}`)
}

async function baseSettings(p) {
  if (!backupExists()) {
    out('! Orca did not report its settings, so they were left as they are (orca-rice repair tries again)')
    return
  }
  const patch = { leftSidebarAppearanceMode: 'match-terminal', ...(p.mode === 'off' ? {} : { terminalBackgroundOpacity: 0 }) }
  out(await setSettings(patch))
}

async function main() {
  const [cmd = 'help', ...args] = process.argv.slice(2)

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') return out(HELP)

  if (cmd === 'check') {
    const r = checkReport()
    // Home folder paths shown as ~, so the output can go into an issue as it is
    if (flag(args, '--json')) out(JSON.stringify(r, null, 2).split(homedir()).join('~'))
    else printCheck(r)
    process.exitCode = r.ok ? 0 : 1
    return
  }

  if (cmd === 'themes') {
    const cur = prefs().theme
    for (const t of THEMES) out(`${t.id === cur ? '*' : ' '} ${t.id.padEnd(17)} ${t.name.padEnd(17)} ${t.light ? 'light' : 'dark '}  scene: ${t.scene.padEnd(16)} font: ${t.font}`)
    return
  }

  if (cmd === 'install') {
    // The flags first, so a typo stops it before anything is checked or written
    const patch = {}
    const theme = opt(args, '--theme')
    if (theme !== undefined) {
      if (themeOf(theme) === null) throw new Error(`no theme "${theme}" (orca-rice themes)`)
      patch.theme = theme
    }
    const scene = opt(args, '--scene')
    if (scene !== undefined) {
      if (!isMode(scene)) throw new Error('--scene takes on, dim, still or off')
      patch.mode = scene
    }
    const shape = opt(args, '--shape')
    if (shape !== undefined) {
      if (shape !== 'cards' && shape !== 'square') throw new Error('--shape takes cards or square')
      patch.shape = shape
    }
    if (flag(args, '--no-fx')) patch.fx = false
    if (flag(args, '--no-chat')) patch.chat = false
    preflight()
    const p = setPrefs(patch)
    out(`themes written for Orca to import: ${writeWarpThemes()} (~/.warp/themes/orca-rice-*.yaml)`)
    writeLook()
    const s = await putIn()
    if (s === null) throw new Error('another orca-rice run is putting the look in right now: try again in a few seconds')
    out(describe(s))
    if (!flag(args, '--keep-settings')) await baseSettings(p)
    const t = themeOf(p.theme)
    if (!fontInstalled(t.font) && FONT_CASKS[t.font]) out(`optional: ${t.name}'s font is ${t.font} (brew install --cask ${FONT_CASKS[t.font]}); Orca uses its own font until then`)
    if (!autostartStatus().installed) out('the look goes when Orca quits or updates: orca-rice ensure puts it back, or orca-rice autostart on does it for you')
    return
  }

  if (cmd === 'theme') {
    const t = themeOf(args[0])
    if (t === null) throw new Error(`usage: orca-rice theme <id> (orca-rice themes lists them)`)
    setPrefs({ theme: t.id })
    return changed(`theme: ${t.name} (${t.scene})`)
  }

  if (cmd === 'scene') {
    if (!isMode(args[0])) throw new Error('usage: orca-rice scene on|dim|still|off')
    const before = prefs().mode
    setPrefs({ mode: args[0] })
    await changed(`scene ${args[0]}`)
    // The scene shows through the text only at Background Opacity 0
    if (before === 'off' && args[0] !== 'off' && enabled() && orcaPid() !== null && backupExists()) out(await setSettings({ terminalBackgroundOpacity: 0 }))
    return
  }

  if (cmd === 'shape') {
    if (args[0] !== 'cards' && args[0] !== 'square') throw new Error('usage: orca-rice shape cards|square')
    setPrefs({ shape: args[0] })
    return changed(args[0] === 'cards' ? 'floating cards' : "Orca's own boxes")
  }

  if (cmd === 'fx') {
    if (args[0] !== 'on' && args[0] !== 'off') throw new Error('usage: orca-rice fx on|off')
    setPrefs({ fx: args[0] === 'on' })
    return changed(`effects ${args[0]}`)
  }

  if (cmd === 'chat') {
    if (args[0] !== 'on' && args[0] !== 'off') throw new Error('usage: orca-rice chat on|off')
    setPrefs({ chat: args[0] === 'on' })
    return changed(`chat extras ${args[0]}`)
  }

  if (cmd === 'project') {
    const [how, folder, id] = args
    if (how === 'list') {
      const m = Object.entries(projectMap())
      return out(m.length === 0 ? 'no project themes' : m.map(([f, t]) => `${f} → ${t}`).join('\n'))
    }
    if (!folder?.startsWith('/')) throw new Error('usage: orca-rice project set <absolute folder> <theme> | clear <folder> | list')
    if (how === 'clear') {
      setProject(folder, null)
      return out(`project theme cleared for ${folder}`)
    }
    if (how !== 'set' || themeOf(id) === null) throw new Error(`usage: orca-rice project set <folder> <theme> (no theme "${id}")`)
    setProject(folder, id)
    return out(`project theme: ${themeOf(id).name} for ${folder} (shows while that project's tabs are in front)`)
  }

  if (cmd === 'fonts') {
    const themes = flag(args, '--all') ? THEMES : [themeOf(prefs().theme)]
    const missing = themes.filter((t) => !fontInstalled(t.font))
    const casks = casksFor(missing)
    return out(casks.length === 0 ? 'the font is installed' : `brew install --cask ${casks.join(' ')}`)
  }

  if (cmd === 'status') {
    const p = prefs()
    out(enabled() ? `installed: ${p.theme}, scene ${p.mode}, ${p.shape}, effects ${p.fx ? 'on' : 'off'}, chat extras ${p.chat ? 'on' : 'off'}` : 'not installed')
    const pid = orcaPid()
    const s = statusOf()
    out(pid === null ? 'Orca is not running' : s && s.pid === pid ? describe(s) : 'Orca is running without the look (orca-rice ensure)')
    const c = installedCompat()
    if (c !== null) out(describeCompat(c.version, c, 'installed'))
    out(`autostart ${autostartStatus().installed ? 'on' : 'off'}`)
    return
  }

  if (cmd === 'doctor') return out(await doctor())

  if (cmd === 'ensure') {
    const r = await ensure()
    if (r !== null) out(`${new Date().toISOString()} ${r}`)
    return
  }

  if (cmd === 'repair') {
    preflight()
    if (!enabled()) throw new Error('orca-rice is not installed (orca-rice install)')
    writeWarpThemes()
    writeLook()
    const s = await putIn({ force: true })
    out(describe(s))
    await baseSettings(prefs())
    return
  }

  if (cmd === 'autostart') {
    const how = args[0] ?? 'status'
    if (how === 'on') {
      const a = autostartOn()
      return out(`autostart on (${a.plist}): the look comes back within a minute after Orca restarts`)
    }
    if (how === 'off') {
      autostartOff()
      return out('autostart off')
    }
    const a = autostartStatus()
    return out(a.installed ? `autostart on (${a.loaded ? 'running' : 'installed, not loaded'})` : 'autostart off')
  }

  if (cmd === 'uninstall') {
    const keep = flag(args, '--keep-settings')
    const restore = !keep && backupExists()
    const pid = orcaPid()
    if (pid === null && restore) {
      throw new Error('Orca is not running: open it, then run orca-rice uninstall again (your earlier settings are put back inside Orca); nothing was changed')
    }
    // Nothing may put the look back while it comes out: autostart first, then the data file the watcher reads
    autostartOff()
    for (const f of [FILE, PROJECT_DATA]) if (existsSync(f)) unlinkSync(f)
    if (pid !== null && (hooked(pid) || restore)) {
      const r = await takeOut({ restoreSettings: restore })
      out(r)
      if (restore && !String(r).includes('settings restored')) {
        throw new Error('the look is out, but your earlier settings were not put back (no Orca window was open); ~/.orca-rice is kept: open a window and run orca-rice uninstall again')
      }
    }
    out(`Warp theme files removed: ${removeWarpThemes()}`)
    // Only orca-rice's own files; the folder goes only if nothing else is in it
    const mine = [FILE, STATUS, PREFS, COMPAT, PROJECTS, PROJECT_DATA, join(STATE, 'autostart.log'), ...(keep ? [] : [BACKUP])]
    for (const f of mine) if (existsSync(f)) unlinkSync(f)
    if (existsSync(LOCK)) rmdirSync(LOCK)
    try {
      rmdirSync(STATE)
    } catch {}
    out(keep && backupExists() ? `orca-rice removed; your Orca settings were left as they are, and the copy from before orca-rice stays in ${BACKUP}` : 'orca-rice removed. This folder (the repo) can be deleted too.')
    return
  }

  throw new Error(`unknown command "${cmd}"\n\n${HELP}`)
}

main().catch((err) => {
  console.error(`orca-rice: ${String(err.message ?? err)}`)
  process.exitCode = 1
})
