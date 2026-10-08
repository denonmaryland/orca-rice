// A theme's pixel scene as one GLSL shader: the theme's colours as constants, then scenes/lib.glsl (shared
// helpers), scenes/<id>.glsl (the picture) and scenes/main.glsl (how it sits behind the terminal's text). The
// shaders use Ghostty's custom-shader conventions (mainImage, iTime, iResolution, iChannel0, iBackgroundColor).

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCENES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'scenes')

// How strongly each mode draws the scene. `still` is full strength, standing on one frame
export const SCENE_MODES = { on: 1, dim: 0.55, still: 1, off: 0 }

// The moment a still scene stands at, in seconds
export const SCENE_STILL_T = 8

const vec3 = (hex) => `vec3(${[1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(4)).join(', ')})`

// The files a theme's shader is put together from
export function sceneSources(t) {
  const read = (f) => readFileSync(join(SCENES_DIR, f), 'utf8')
  return { lib: read('lib.glsl'), scene: read(`${t.id}.glsl`), main: read('main.glsl') }
}

// One theme's whole shader. `strength` scales the scene (1 as designed, lower is quieter); `still` stands it at
// SCENE_STILL_T instead of moving
export function sceneShader(t, src, strength = 1, still = false) {
  const u = t.ui
  const consts = [
    `const vec3 FG = ${vec3(t.term.fg)};`,
    ...t.term.normal.map((c, i) => `const vec3 K${i} = ${vec3(c)};`),
    ...t.term.bright.map((c, i) => `const vec3 KB${i} = ${vec3(c)};`),
    ...Object.keys(u).map((k) => `const vec3 U_${k === 'onAccent' ? 'ON' : k.toUpperCase()} = ${vec3(u[k])};`),
    `const bool LIGHT = ${t.light};`,
    `const float STRENGTH = ${strength.toFixed(3)};`,
    `const float STILL_T = ${still ? SCENE_STILL_T.toFixed(1) : '-1.0'};`,
  ]
  return [`// orca-rice scene: ${t.name}, "${t.scene}".`, '', ...consts, '', src.lib.trim(), '', src.scene.trim(), '', src.main.trim(), ''].join('\n')
}
