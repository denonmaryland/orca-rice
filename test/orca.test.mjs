import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

// Everything orca-rice writes goes to a throwaway folder in these tests
const TMP = mkdtempSync(join(tmpdir(), 'orca-rice-test-'))
process.env.ORCA_RICE_DIR = join(TMP, 'state')
process.env.ORCA_RICE_WARP = join(TMP, 'warp')
process.env.ORCA_RICE_APP = join(TMP, 'NoOrca.app')

const ROOT = join(import.meta.dirname, '..')
const { checkOrca, describeCompat, ORCA_HOOKS } = await import('../lib/compat.mjs')
const orca = await import('../lib/orca.mjs')
const { removeWarpThemes, warpYaml, writeWarpThemes } = await import('../lib/warp.mjs')
const { THEMES } = await import('../lib/themes.mjs')

test.after(() => rmSync(TMP, { recursive: true, force: true }))

test('the code sent into Orca parses: the watcher, a settings change, taking the look out', () => {
  assert.doesNotThrow(() => new Function(`return ${orca.bootstrap()}`))
  assert.doesNotThrow(() => new Function(`return ${orca.settingsCode({ terminalBackgroundOpacity: 0, leftSidebarAppearanceMode: 'match-terminal' })}`))
  assert.doesNotThrow(() => new Function(`return ${orca.takeOutCode({ terminalThemeDark: 'custom:a', terminalCustomThemes: [{ id: 'a', name: 'b' }] })}`))
  assert.doesNotThrow(() => new Function(`return ${orca.takeOutCode(null)}`))
})

test('the layer parses, and the watcher accepts every scene mode and carries the layer version', () => {
  const layer = readFileSync(join(ROOT, 'layer', 'rice-layer.js'), 'utf8')
  assert.doesNotThrow(() => new Function(layer))
  const lv = /const V = (\d+)/.exec(layer)[1]
  const code = orca.bootstrap()
  assert.match(code, new RegExp(`LV = ${lv}`))
  assert.match(code, /\['on', 'dim', 'still', 'off'\]\.includes\(p\.mode\)/)
  assert.match(layer, /\['on', 'dim', 'still', 'off'\]\.includes\(p\.mode\)/)
  assert.doesNotMatch(layer, /logoLayer|LOGO_/)
  // The chat switch reaches the layer, as data
  assert.match(code, /chat: p\.chat === true/)
  assert.match(layer, /payload\.chat = !!\(p && p\.chat === true\)/)
})

test('a fresh Orca: the imported themes reach the window with the theme, and unset settings are saved at their defaults', () => {
  const code = orca.bootstrap()
  // Orca's settings channel saves an import without telling the open window; the list goes with the theme
  assert.match(code, /wc\.send\('settings:changed', \{ terminalCustomThemes: r\.themes, \.\.\.patch \}\)/)
  // A setting never written reads as undefined; uninstall needs Orca's default to put back
  assert.match(code, /terminalBackgroundOpacity \?\? 1/)
  assert.match(code, /leftSidebarAppearanceMode \?\? 'default'/)
  assert.match(code, /terminalThemeDark \?\? 'Ghostty Default Style Dark'/)
})

test("the layer leaves Orca's agent spinners turning, and carries nothing of anyone's own setup", () => {
  const layer = readFileSync(join(ROOT, 'layer', 'rice-layer.js'), 'utf8')
  // A transform on Orca's spinner overrides its spin: they stood still
  assert.doesNotMatch(layer, /agent-working-spinner/)
  assert.doesNotMatch(layer, /djm|status line|paneInfo|pty\.write/i)
})

test('only Background Opacity and the sidebar appearance can be set', () => {
  assert.throws(() => orca.settingsCode({ theme: 'dark' }), /does not set theme/)
  assert.throws(() => orca.settingsCode({ terminalBackgroundOpacity: 2 }), /does not set/)
  assert.throws(() => orca.settingsCode({ leftSidebarAppearanceMode: 'x"; alert(1); "' }), /does not set/)
})

test('preferences fall back to sane values; the look file follows them', () => {
  assert.deepEqual(orca.prefs(), orca.DEFAULT_PREFS)
  orca.setPrefs({ theme: 'nord', mode: 'still', shape: 'square', fx: false, chat: false })
  const p = orca.writeLook()
  assert.deepEqual(p, { theme: 'nord', mode: 'still', shape: 'square', fx: false, chat: false })
  const look = JSON.parse(readFileSync(join(process.env.ORCA_RICE_DIR, 'look.json'), 'utf8'))
  assert.equal(look.theme, 'nord')
  assert.equal(look.mode, 'still')
  assert.equal(look.shape, 'square')
  assert.equal(look.trail, false)
  assert.equal(look.chat, false)
  orca.setPrefs({ chat: 'yes' })
  assert.equal(orca.prefs().chat, true)
  orca.setPrefs({ theme: 'no-such-theme', mode: 'loud' })
  assert.equal(orca.prefs().theme, 'ethereal')
  assert.equal(orca.prefs().mode, 'on')
  orca.setPrefs({ mode: 'constructor' })
  assert.equal(orca.prefs().mode, 'on')
})

test('project themes: a folder maps to a theme, with no font in its look', () => {
  orca.setProject('/Users/someone/code/app', 'gruvbox')
  orca.writeLook()
  const list = JSON.parse(readFileSync(join(process.env.ORCA_RICE_DIR, 'projects-look.json'), 'utf8'))
  assert.equal(list.length, 1)
  assert.equal(list[0].theme, 'gruvbox')
  assert.equal(list[0].look.font, undefined)
  assert.equal(list[0].look.keep, false)
  orca.setProject('/Users/someone/code/app', null)
  assert.deepEqual(orca.projectMap(), {})
})

test('a report from an older watcher is said plainly, never read as success', () => {
  assert.match(orca.describe({ v: 0, window: { mode: 'on', drawn: true } }), /older watcher/)
  assert.match(orca.describe({ v: orca.WATCHER_V, window: { mode: 'still', theme: 'nord', drawn: true, cards: true } }), /nord scene drawn \(still\); floating cards$/)
  assert.match(orca.describe({ v: orca.WATCHER_V, window: { mode: 'on', theme: 'nord', drawn: true, cards: true, chat: true } }), /floating cards; chat extras$/)
  assert.match(orca.describe({ v: orca.WATCHER_V, window: { mode: 'off', chat: true } }), /scene off, chat extras$/)
})

test('Warp theme files: one per theme, removed again, nothing else touched', () => {
  assert.equal(writeWarpThemes(), 22)
  const files = readdirSync(process.env.ORCA_RICE_WARP)
  assert.equal(files.filter((f) => f.startsWith('orca-rice-')).length, 22)
  const y = warpYaml(THEMES.find((t) => t.id === 'nord'))
  assert.match(y, /^name: Nord \(Omarchy\)$/m)
  assert.equal((y.match(/^ {4}(black|red|green|yellow|blue|magenta|cyan|white): '#[0-9A-F]{6}'$/gm) ?? []).length, 16)
  assert.equal(removeWarpThemes(), 22)
})

test('the Orca check: every hook found means every part on; a missing one pauses its part, the inspector fuse closes the door', () => {
  const all = { main: '', preload: '', renderer: '' }
  for (const h of ORCA_HOOKS) all[h.in] += typeof h.find === 'string' ? ` ${h.find} ` : ' trafficLightPosition:{x:16,y:12} setWindowButtonPosition({x:16,y:a}) Math.round(18*z-6) '
  const ok = checkOrca({ fuses: '101100011', ...all })
  assert.deepEqual([ok.door, ok.scene, ok.cards, ok.theme, ok.lights, ok.chat], [true, true, true, true, true, true])
  // The chat view changed: only the chat extras pause; a minor chat hook gone costs only its detail
  const noChat = checkOrca({ fuses: '101100011', ...all, renderer: all.renderer.replace('data-native-chat-root', '') })
  assert.deepEqual([noChat.scene, noChat.cards, noChat.theme, noChat.chat], [true, true, true, false])
  assert.match(describeCompat('9.9.9', noChat), /the chat extras paused \(Orca changed chat view/)
  const noToggle = checkOrca({ fuses: '101100011', ...all, renderer: all.renderer.replace('onToggleExpandedTurn', '') })
  assert.equal(noToggle.chat, true)
  assert.ok(noToggle.minor.some((m) => m.what.startsWith('opening turns')))
  const noHost = checkOrca({ fuses: '101100011', ...all, renderer: all.renderer.replace('data-retained-pane-host', '') })
  assert.equal(noHost.scene, false)
  assert.equal(noHost.cards, false)
  assert.equal(noHost.theme, true)
  const shut = checkOrca({ fuses: '101000011', ...all })
  assert.equal(shut.door, false)
  assert.match(describeCompat('9.9.9', shut), /no longer lets orca-rice in/)
})
