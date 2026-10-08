// Orca imports terminal themes the way its own Settings › Terminal › Import from Warp does: from Warp theme files in
// ~/.warp/themes. orca-rice writes one file per theme there (orca-rice-<id>.yaml) and the watcher asks Orca to
// import the one in use, by name, the first time it is shown. Warp itself lists these themes too, if you use it.

import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { appName } from './look.mjs'
import { WARP_THEMES } from './paths.mjs'
import { THEMES } from './themes.mjs'

const NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

export function warpYaml(t) {
  const p = t.term
  const q = (c) => `'${c.toUpperCase()}'`
  return [
    `# ${appName(t)}: written by orca-rice for Orca's Import from Warp`,
    `name: ${appName(t)}`,
    `accent: ${q(t.ui.violet)}`,
    `cursor: ${q(p.cursor)}`,
    `background: ${q(p.bg)}`,
    `foreground: ${q(p.fg)}`,
    `details: ${t.light ? 'lighter' : 'darker'}`,
    'terminal_colors:',
    '  normal:',
    ...p.normal.map((c, i) => `    ${NAMES[i]}: ${q(c)}`),
    '  bright:',
    ...p.bright.map((c, i) => `    ${NAMES[i]}: ${q(c)}`),
    '',
  ].join('\n')
}

const fileOf = (t) => join(WARP_THEMES, `orca-rice-${t.id}.yaml`)

export function writeWarpThemes() {
  mkdirSync(WARP_THEMES, { recursive: true })
  for (const t of THEMES) writeFileSync(fileOf(t), warpYaml(t))
  return THEMES.length
}

export function removeWarpThemes() {
  if (!existsSync(WARP_THEMES)) return 0
  let n = 0
  for (const f of readdirSync(WARP_THEMES)) {
    if (/^orca-rice-[a-z0-9-]+\.yaml$/.test(f)) {
      unlinkSync(join(WARP_THEMES, f))
      n++
    }
  }
  return n
}
