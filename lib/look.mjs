// The data the watcher in Orca reads: a theme's scene shader, the colours of Orca's frame, and the name Orca's
// terminal theme was imported under. Data only: the watcher checks every field before the layer sees it.

import { SCENE_MODES, sceneShader, sceneSources } from './scenes.mjs'

// The name a theme goes by in Orca (and in ~/.warp/themes, where Orca imports it from): it says where it came from,
// so it never shadows a built-in theme of the same name
export function appName(t) {
  return `${t.name} (Omarchy)`
}

const hex3 = (h) => [1, 3, 5].map((i) => Number((parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)))

// What this Orca can take (lib/compat.mjs): a part whose hooks are gone is left out. `fx`: the cursor trail and the
// retro themes' CRT
export function lookOf(t, { mode = 'on', shape = 'cards', fx = true, keep = true, gates = {} } = {}) {
  const look = {
    bg: hex3(t.term.bg),
    fg: t.term.fg,
    accent: [t.ui.violet, t.ui.magenta],
    // The agents' lights: waiting, done, failed
    signal: [t.ui.amber, t.ui.mint, t.ui.red],
    shape: gates.cards === false ? 'square' : shape,
    ...(gates.theme === false ? {} : { terminal: appName(t) }),
    ...(gates.theme === false || gates.fonts === false ? {} : { font: t.font }),
    keep,
    lights: gates.lights !== false,
    trail: fx && gates.fx !== false,
    crt: fx ? t.crt : 0,
  }
  if (mode === 'off') return { mode: 'off', theme: t.id, name: t.name, ...look }
  return { mode, theme: t.id, name: t.name, scene: t.scene, shader: sceneShader(t, sceneSources(t), SCENE_MODES[mode], mode === 'still'), ...look }
}
