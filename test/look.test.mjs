import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { appName, lookOf } from '../lib/look.mjs'
import { SCENE_MODES, sceneShader, sceneSources } from '../lib/scenes.mjs'
import { FONT_CASKS, THEMES } from '../lib/themes.mjs'

const ROOT = join(import.meta.dirname, '..')

test('22 themes, each with a scene file, a font with a cask, and colours in #rrggbb', () => {
  assert.equal(THEMES.length, 22)
  assert.equal(new Set(THEMES.map((t) => t.id)).size, 22)
  const hex = /^#[0-9a-f]{6}$/i
  for (const t of THEMES) {
    assert.match(t.id, /^[a-z0-9-]+$/)
    assert.ok(existsSync(join(ROOT, 'scenes', `${t.id}.glsl`)), `${t.id}: no scene`)
    assert.ok(FONT_CASKS[t.font], `${t.id}: no cask for ${t.font}`)
    assert.ok(t.scene.length > 0)
    for (const c of [t.term.bg, t.term.fg, t.term.cursor, ...t.term.normal, ...t.term.bright, ...Object.values(t.ui)]) assert.match(c, hex, `${t.id}: ${c}`)
    assert.equal(t.term.normal.length, 8)
    assert.equal(t.term.bright.length, 8)
  }
})

test('every shader is put together whole, with no logo in it', () => {
  for (const t of THEMES) {
    const glsl = sceneShader(t, sceneSources(t))
    assert.match(glsl, /void mainImage\(out vec4 fragColor, in vec2 fragCoord\)/)
    assert.match(glsl, /vec3 scene\(vec2 p, vec2 R, float t\)/)
    assert.doesNotMatch(glsl, /LOGO|logoLayer|logoBit/, t.id)
  }
})

test('a still scene stands at t = 8; a moving one reads the clock; dim draws quieter', () => {
  const t = THEMES[0]
  const src = sceneSources(t)
  assert.match(sceneShader(t, src, 1, true), /const float STILL_T = 8\.0;/)
  assert.match(sceneShader(t, src), /const float STILL_T = -1\.0;/)
  assert.match(sceneShader(t, src, SCENE_MODES.dim), /const float STRENGTH = 0\.550;/)
  assert.match(readFileSync(join(ROOT, 'scenes', 'main.glsl'), 'utf8'), /STILL_T >= 0\.0 \? STILL_T : floor\(iTime \* 10\.0\) \/ 10\.0/)
})

test("the look file: a shader unless off; what Orca cannot take is left out", () => {
  const t = THEMES.find((x) => x.id === 'retro-82')
  const still = lookOf(t, { mode: 'still' })
  assert.equal(still.mode, 'still')
  assert.match(still.shader, /STILL_T = 8\.0/)
  assert.equal(still.terminal, 'Retro 82 (Omarchy)')
  assert.equal(still.crt, t.crt)
  assert.deepEqual(still.signal, [t.ui.amber, t.ui.mint, t.ui.red])
  const off = lookOf(t, { mode: 'off' })
  assert.equal(off.shader, undefined)
  const limited = lookOf(t, { gates: { cards: false, theme: false } })
  assert.equal(limited.shape, 'square')
  assert.equal(limited.terminal, undefined)
  assert.equal(limited.font, undefined)
  assert.equal(lookOf(t, { fx: false }).crt, 0)
  assert.equal(still.chat, true)
  assert.equal(lookOf(t, { chat: false }).chat, false)
  assert.equal(lookOf(t, { gates: { chat: false } }).chat, false)
  assert.equal(appName(THEMES[0]), `${THEMES[0].name} (Omarchy)`)
})
