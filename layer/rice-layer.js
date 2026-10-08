// orca-rice's look inside Orca's own page. lib/orca.mjs puts this script into Orca's window and then calls
// window.__riceScene.apply(payload) with data only: the scene's GLSL (Ghostty's custom-shader format), the theme's
// colours, the shape and the mode. One canvas on <body>, just under the terminal pane
// host, so none of Orca's own elements are moved; a stylesheet clears the backgrounds Orca paints over it. The
// terminal text shows the scene where Orca's Background Opacity lets it through (0: all of it). It moves at 10
// frames a second while Orca's window has focus and holds its last frame otherwise; a still scene (payload.mode
// 'still') is drawn once and again only when something on it changes.
//
// That opacity has two side effects in Orca, and this layer undoes both for as long as it is in: the left
// sidebar's Match Terminal colours take the same opacity (at 0 the sidebar shows Orca's plain base), and with the
// scene off the terminal would show black. So the sidebar is given the terminal's colours at full strength again
// (only in Match Terminal mode), and with the scene off the terminal area is filled with its own background.
// With the sidebar on Match Terminal, the rest of the frame follows too (Orca has no setting for it): the strip
// above the tabs, the tab bar and the status bar at the bottom take the terminal's colours instead of Orca's
// neutral grey.
//
// Shape (payload.shape 'cards', orca-rice shape cards), tiled the way Omarchy's desktop is: the scene becomes the
// wallpaper of the whole window, and on it float the sidebar card, each tab bar as a bar of its own, every
// terminal pane as a rounded tile (tinted, so text stays readable; the focused one ringed in the theme's two
// accents) and the status bar as a pill. Without a scene the wallpaper is a glow in the accents. Layout only
// through a stylesheet. In Orca's own shape the scene stays under the terminals, its corners following any
// rounded card it sits in (Orca's floating terminal panel). dispose() takes everything away.
;(() => {
  const V = 1
  const old = window.__riceScene
  if (old && old.v === V) return
  if (old) {
    try {
      old.dispose()
    } catch {}
  }

  const HOST = '[data-retained-pane-host]'
  // The moment a still scene stands at, in seconds (SCENE_STILL_T in lib/scenes.mjs)
  const STILL_T = 8
  const SIDEBAR = '[style*="--worktree-sidebar"]'
  // Orca's frame: the strip above the tabs and the tab bar (both release the terminal's focus), the status bar
  const FRAME = '[data-terminal-focus-release-surface], [class*="--bg-titlebar"]'
  const VS = '#version 300 es\nin vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'
  const PRE =
    '#version 300 es\nprecision highp float; precision highp int;\n' +
    'uniform vec3 iResolution; uniform float iTime; uniform sampler2D iChannel0; uniform vec3 iBackgroundColor;\nout vec4 outColor;\n'
  // Ghostty's fragCoord starts top left; each host is drawn in its own rectangle of the one canvas, its corners
  // cut round where it meets a rounded card's (uRad: bottom left, bottom right, top right, top left, in pixels)
  // The agents in the wallpaper (cards only): a light per agent tab, by state (0 resting, 1 working, 2 waiting on
  // you, 3 done, 4 failed), drifting a little in the sky, and a ripple out from one that just finished
  const POST = `
uniform vec2 uOff; uniform float uH; uniform vec4 uRad; uniform float uScale;
uniform vec4 uLights[16]; uniform int uLightN; uniform vec3 uCol[5]; uniform vec4 uRipple; uniform float uDpr;
vec4 riceAgents(vec2 p) {
  vec3 col = vec3(0.0); float amt = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uLightN) break;
    vec4 L = uLights[i];
    int s = int(L.z + 0.5);
    vec2 c = L.xy + vec2(sin(iTime * 0.11 + L.w), cos(iTime * 0.07 + L.w * 1.3)) * 14.0 * uDpr;
    float r = length(p - c) / uDpr;
    float pulse = s == 1 ? 0.7 + 0.3 * sin(iTime * 2.4 + L.w) : s == 2 ? 0.5 + 0.5 * sin(iTime * 2.6 + L.w) : 1.0;
    float k = (s == 0 ? 0.35 : 1.0) * pulse;
    float g = (exp(-r * r / 9.0) * 0.95 + exp(-r / (s == 0 ? 5.0 : 15.0)) * (s == 0 ? 0.12 : 0.4)) * k;
    vec3 cc = s == 0 ? uCol[0] : s == 1 ? uCol[1] : s == 2 ? uCol[2] : s == 3 ? uCol[3] : uCol[4];
    col += cc * g; amt += g;
  }
  if (uRipple.z >= 0.0 && uRipple.z < 1.6) {
    float t = uRipple.z / 1.6;
    float R = t * 0.8 * length(iResolution.xy);
    float d = abs(length(p - uRipple.xy) - R) / uDpr;
    float g = exp(-d * d / 50.0) * (1.0 - t) * 0.4;
    vec3 cc = uRipple.w > 2.5 ? uCol[3] : uCol[2];
    col += cc * g; amt += g;
  }
  return vec4(amt > 0.0 ? col / amt : col, clamp(amt, 0.0, 1.0));
}
float riceCorner(vec2 p, vec2 c, float r, vec2 inward) {
  if (r <= 0.0) return 1.0;
  vec2 o = c + inward * r;
  if (dot(p - o, inward) >= 0.0 || (p.x - o.x) * inward.x >= 0.0 || (p.y - o.y) * inward.y >= 0.0) return 1.0;
  return clamp(r - length(p - o) + 0.5, 0.0, 1.0);
}
void main(){
  vec2 p = (gl_FragCoord.xy - uOff) * uScale;
  vec2 s = iResolution.xy;
  float a = riceCorner(p, vec2(0.0), uRad.x, vec2(1.0, 1.0)) * riceCorner(p, vec2(s.x, 0.0), uRad.y, vec2(-1.0, 1.0))
          * riceCorner(p, s, uRad.z, vec2(-1.0, -1.0)) * riceCorner(p, vec2(0.0, s.y), uRad.w, vec2(1.0, -1.0));
  if (a <= 0.0) { outColor = vec4(0.0); return; }
  mainImage(outColor, vec2(p.x, uH - p.y));
  vec4 ag = riceAgents(p);
  outColor.rgb = mix(outColor.rgb, ag.rgb, ag.a);
  outColor = vec4(outColor.rgb * a, a);
}`

  // Motion: the ring's angle as a typed property (so it can animate), the keyframes, and none of it for anyone who
  // asked the system for less motion
  const MOTION = [
    "@property --rice-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }",
    '@keyframes rice-spin { to { --rice-angle: 360deg; } }',
    '@keyframes rice-breathe { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }',
    '@property --rice-wipe { syntax: "<percentage>"; inherits: false; initial-value: -20%; }',
    '@keyframes rice-wipe { from { --rice-wipe: -20%; } to { --rice-wipe: 120%; } }',
    '.rice-scene-wipe { position: fixed; pointer-events: none; margin: 0; padding: 0; border: 0; animation: rice-wipe 0.9s var(--rice-ease) forwards; ' +
      '-webkit-mask-image: linear-gradient(115deg, transparent var(--rice-wipe), #000 calc(var(--rice-wipe) + 18%)); ' +
      'mask-image: linear-gradient(115deg, transparent var(--rice-wipe), #000 calc(var(--rice-wipe) + 18%)); }',
    '@media (prefers-reduced-motion: reduce) { .rice-scene-wipe { display: none; } ' +
      '[data-retained-pane-host] .pane::after { animation: none !important; } button:not(:disabled):active { scale: none !important; } }',
  ].join('\n')

  // Feel, Orca's whole window, in one motion language (MonoCode's): a quick start and a long soft settle.
  // --rice-ease for whatever answers the pointer or changes colour, --rice-pop for whatever arrives (menus, dialogs,
  // the focus ring). Orca's Tailwind default (150 ms on the material ease) is retuned to the same, so its own hovers
  // and fades speak it too. Menus pop from 94% in 170 ms and dialogs lift 8 px in 200 (MonoCode's popover-open and
  // modal-panel-in); anything closing gets out of the way in 80; worktree rows answer in 120 ms instead of trailing
  // a 200 ms fade; buttons give under the press; the page never rubber-bands. Less motion asked for: fades only
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
  const POP = 'cubic-bezier(0.16, 1, 0.3, 1)'
  const POPPER = ['dropdown-menu-content', 'dropdown-menu-sub-content', 'context-menu-content', 'context-menu-sub-content', 'popover-content', 'select-content', 'hover-card-content']
    .map((s) => `[data-slot="${s}"][data-state="open"]`)
    .join(', ')
  const FEEL = [
    `:root { --rice-ease: ${EASE}; --rice-pop: ${POP}; --default-transition-duration: 120ms; --default-transition-timing-function: ${EASE}; }`,
    'html, body { overscroll-behavior: none; }',
    // Orca's agent spinners (sidebar and tabs) tick 12 times a second, painted into whatever layer holds them: with the
    // sidebar that was the whole window, repainted 12 times a second while any agent worked (measured, CDP paint
    // events: 36 window repaints in 3 s, none with this). A layer of their own; the same ticking spin
    '.agent-working-spinner { transform: translateZ(0); will-change: transform; backface-visibility: hidden; }',
    'button:not(:disabled):active { scale: 0.97; }',
    '[data-worktree-card-surface] { transition-duration: 0.12s !important; transition-timing-function: var(--rice-ease) !important; }',
    '[class*="animate-in"][data-state="open"] { animation-duration: 0.17s !important; animation-timing-function: var(--rice-pop) !important; }',
    '[class*="animate-out"][data-state="closed"] { animation-duration: 0.08s !important; animation-timing-function: ease-in !important; }',
    `${POPPER} { animation: enter 0.17s var(--rice-pop) backwards !important; --tw-enter-opacity: 0 !important; --tw-enter-scale: 0.94 !important; }`,
    '[data-slot="dialog-content"][data-state="open"] { animation: enter 0.2s var(--rice-pop) backwards !important; --tw-enter-opacity: 0 !important; ' +
      '--tw-enter-scale: 0.98 !important; --tw-enter-translate-x: 0 !important; --tw-enter-translate-y: 8px !important; }',
    ':is([data-slot="dialog-overlay"], [data-slot="sheet-overlay"])[data-state="open"] { animation: enter 0.16s ease-out backwards !important; --tw-enter-opacity: 0 !important; }',
    '[data-slot="sheet-content"][data-state="open"] { animation-duration: 0.26s !important; animation-timing-function: var(--rice-pop) !important; }',
    '[data-slot="tooltip-content"] { animation-duration: 0.12s !important; animation-timing-function: var(--rice-pop) !important; }',
    '@media (prefers-reduced-motion: reduce) { [data-slot][data-state="open"] { --tw-enter-scale: 1 !important; --tw-enter-translate-x: 0 !important; --tw-enter-translate-y: 0 !important; } }',
  ].join('\n')

  let payload = null
  let style = null
  let canvas = null
  let gl = null
  let prog = null
  let key = ''
  let err = null
  let drawn = false
  let timer = 0
  let timerMs = 100
  let res = []
  let sidebar = false
  let frame = false
  let cards = false
  const t0 = performance.now()

  // Any CSS colour to [r, g, b, a] (0-255, alpha 0-1), through the canvas's own parser; null for anything that is
  // not a plain colour (a color-mix, as the Tinted sidebar uses)
  const probe = document.createElement('canvas').getContext('2d')
  function rgba(css) {
    if (!css) return null
    // A value the parser refuses leaves the sentinel in place
    probe.fillStyle = '#010203'
    probe.fillStyle = css.trim()
    const v = probe.fillStyle
    if (v === '#010203' && !/^(#010203|rgb\(1, 2, 3\))$/i.test(css.trim())) return null
    let m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(v)
    if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 1]
    m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(v)
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
    return null
  }
  const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`
  const isLight = (css) => {
    const c = rgba(css)
    return c !== null && (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 > 0.5
  }
  // Orca's muted text is the foreground at 62% over the background; light themes with soft text (Rose Pine Dawn,
  // Catppuccin Latte) fall under 3:1 there, so light themes get 78%
  const mutedPct = (t) => (isLight(t) ? 78 : 62)

  function visibleHosts() {
    return [...document.querySelectorAll(HOST)]
      .filter((h) => {
        const r = h.getBoundingClientRect()
        if (r.width < 2 || r.height < 2) return false
        if (h.checkVisibility && !h.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false
        return [...h.querySelectorAll('.xterm')].some((x) => x.getBoundingClientRect().width > 0)
      })
      .slice(0, 4)
  }

  // The terminal's own background, as Orca gives it to the terminal (opacity taken off), else the theme's
  function terminalBg() {
    for (const x of document.querySelectorAll(`${HOST} .xterm`)) {
      const c = rgba(x.style.backgroundColor)
      if (c) return rgb(c)
    }
    return Array.isArray(payload?.bg) ? rgb(payload.bg.map((v) => Math.round(v * 255))) : null
  }

  // The terminal's colours as Orca gives them to a Match Terminal sidebar (its background a plain colour, maybe with
  // the opacity in it); null when the sidebar is Default or Tinted
  function terminalColours() {
    const el = document.querySelector(SIDEBAR)
    if (!el) return null
    const c = rgba(el.style.getPropertyValue('--worktree-sidebar'))
    if (!c) return null
    return { el, t: rgb(c), n: el.style.getPropertyValue('--worktree-sidebar-foreground').trim() || '#fafafa', translucent: c[3] < 1 }
  }

  // The frame in the terminal's colours: Orca's own token mix (as for the sidebar), with the bars' base the
  // terminal background itself, so the top row runs on from the sidebar's
  function frameRule(tc) {
    frame = false
    if (!tc) return ''
    const { t, n } = tc
    const mix = (p) => `color-mix(in srgb, ${n} ${p}%, ${t})`
    frame = document.querySelector(FRAME) !== null
    return `${FRAME} { --card: ${t}; --bg-titlebar: ${t}; --background: ${t}; --foreground: ${n}; --card-foreground: ${n}; --accent: ${mix(9)}; --accent-foreground: ${n}; --muted: ${mix(7)}; --muted-foreground: ${mix(mutedPct(t))}; --border: ${mix(7)}; }`
  }

  // Tiles: one 8 px gap everywhere. The sidebar is a title pill over a frosted card, each tab bar a bar of its own
  // flush with the tiles under it, every terminal pane a rounded tile whose text sits 12/10 px in from its edge (Orca
  // pads only the top and left, so text ran into the rounded corners), split panes 8 px apart, the status bar a
  // pill. Nothing inside a clipping box gets an outer shadow (they were sliced off at the edges): edges are inset
  // hairlines, the cards' shadows small enough for the gap. The scene is the wallpaper behind it all (tick); the root's glow is for no scene
  function cardsRule(t, n) {
    cards = false
    if (payload?.shape !== 'cards' || !t) return ''
    const row = '.app-layout div:has(> div > .titlebar-left)'
    if (!document.querySelector(row)) return ''
    cards = true
    const [a1, a2] = payload.accent ?? [n, n]
    const amber = (payload.signal ?? ['#ffb347'])[0]
    const light = isLight(t)
    const side = `${row} > div:has(> .titlebar-left)`
    const work = `${row} > div:not(:has(> .titlebar-left))`
    const status = '.app-layout > [class*="--bg-titlebar"]'
    const tile = `${HOST} [data-terminal-layout-leaf-ids] .pane`
    const edge = `color-mix(in srgb, ${n} ${light ? 14 : 12}%, transparent)`
    const glass = `color-mix(in srgb, ${t} 90%, transparent)`
    // Fits in the 8 px gap: 4 px down, 8 px blur, pulled in by 4
    const lift = `0 1px 2px rgba(0, 0, 0, ${light ? 0.12 : 0.28}), 0 4px 8px -4px rgba(0, 0, 0, ${light ? 0.18 : 0.4})`
    // A ring inside the tile's rounded edge: a masked layer, so a gradient can be the border
    const ring = (w, paint) =>
      `content: ''; position: absolute; inset: 0; border-radius: inherit; padding: ${w}px; background: ${paint}; ` +
      '-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; ' +
      'mask-composite: exclude; pointer-events: none; z-index: 30;'
    const mix = (p) => `color-mix(in srgb, ${n} ${p}%, ${t})`
    return [
      // The whole layout in the terminal's colours, Orca's token recipe (as for its Match Terminal sidebar), and the
      // text colour set again: Orca sets it once on the body, so text without a colour of its own kept the dark
      // theme's white on a light theme
      `.app-layout { --background: ${t}; --foreground: ${n}; --card: ${mix(4)}; --card-foreground: ${n}; --popover: ${mix(4)}; ` +
        `--popover-foreground: ${n}; --muted: ${mix(7)}; --muted-foreground: ${mix(mutedPct(t))}; --accent: ${mix(9)}; --accent-foreground: ${n}; ` +
        `--secondary: ${mix(9)}; --secondary-foreground: ${n}; --primary: ${n}; --primary-foreground: ${t}; --border: ${mix(10)}; --input: ${mix(12)}; ` +
        `--ring: ${a1}; color: ${n}; color-scheme: ${light ? 'light' : 'dark'}; }`,
      // The glow is the root's own background, painted first; the body clears, so the wallpaper canvas (z -1) is
      // the next thing up
      `html { background: radial-gradient(70% 60% at 12% 0%, color-mix(in srgb, ${a1} ${light ? 30 : 22}%, transparent), transparent 70%), ` +
        `radial-gradient(60% 60% at 100% 100%, color-mix(in srgb, ${a2} ${light ? 26 : 18}%, transparent), transparent 70%), ` +
        `color-mix(in srgb, ${t} ${light ? 90 : 78}%, #000) !important; }`,
      'body { background: transparent !important; }',
      `${row} { padding: 8px 8px 0 8px !important; gap: 8px !important; }`,
      // The sidebar in two: its title row a pill like the tab bars beside it (32 px from the same top, where the
      // watcher centres macOS's window buttons), and the list a frosted card from where the tiles start. Collapsed,
      // Orca floats the same row at the same corner, so it stays the pill the buttons sit in
      `${side} { gap: 8px !important; }`,
      `${side} > .titlebar-left { height: 32px !important; min-height: 32px !important; border-radius: 12px !important; border-color: transparent !important; ` +
        `background: ${glass} !important; box-shadow: inset 0 0 0 1px ${edge} !important; }`,
      `${side} > .titlebar-left + div { border-radius: 14px !important; overflow: hidden !important; box-shadow: ${lift}, 0 0 0 1px ${edge} !important; ` +
        '-webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3); }',
      // Collapsed, the list is 0 px wide: no gap after it (the tiles' left edge under the title pill's), and no edge,
      // which alone would stand as a line down the window's left
      `${row}:has(> .w-0 > .titlebar-left) { gap: 0 !important; }`,
      `${side}.w-0 > .titlebar-left + div { box-shadow: none !important; }`,
      `${work} { background: transparent !important; }`,
      `${work} .border-l.border-border { border-left-color: transparent !important; }`,
      // The 4 px strip above the tabs would push the tab bar below the sidebar's top edge
      `${work} [data-terminal-focus-release-surface]:not([data-tab-group-strip-id]) { height: 0 !important; min-height: 0 !important; background: transparent !important; }`,
      `[data-tab-group-strip-id] { margin: 0 0 8px 0 !important; padding: 0 4px !important; border-radius: 12px !important; border-color: transparent !important; ` +
        `background: ${glass} !important; box-shadow: inset 0 0 0 1px ${edge} !important; }`,
      // Collapsed, the first tab bar keeps the floating title row's width free inside it (a spacer); as pills the two
      // sit side by side instead, the tab bar starting a gap after the title pill
      `[data-tab-group-strip-id]:has([style*="collapsed-sidebar-header-width"]) { margin-left: calc(var(--collapsed-sidebar-header-width) + 8px) !important; }`,
      `[data-tab-group-strip-id] [style*="collapsed-sidebar-header-width"] { width: 0 !important; }`,
      `[data-tab-id] { border-radius: 8px !important; border-color: transparent !important; margin: 4px 1px !important; height: calc(100% - 8px) !important; ` +
        'background: transparent !important; transition: background-color 0.12s var(--rice-ease), box-shadow 0.12s var(--rice-ease); }',
      `[data-tab-id]:hover { background: color-mix(in srgb, ${n} 7%, ${t}) !important; }`,
      `[data-tab-id][data-active="true"] { background: color-mix(in srgb, ${n} 12%, ${t}) !important; box-shadow: inset 0 0 0 1px color-mix(in srgb, ${a1} 45%, transparent) !important; }`,
      // Orca's 2 px underline under the active tab; the pill's outline says it instead
      '[data-tab-id] [class*="h-[2px]"][class*="bottom-0"] { display: none !important; }',
      `${tile} { border-radius: 12px !important; background: ${payload.mode === 'off' ? t : `color-mix(in srgb, ${t} 45%, transparent)`} !important; box-shadow: none !important; }`,
      // Even padding: Orca's own rule insets the container by its padding at the top and left only. Its fit follows
      // this box (a ResizeObserver on it), so rows and columns are recounted when it changes
      `${tile} > .xterm-container { width: calc(100% - 24px) !important; height: calc(100% - 20px) !important; margin: 10px 12px !important; }`,
      `${tile}::after { ${ring(1, edge)} }`,
      // The pane's own buttons (top right): glass in the theme's colours instead of Orca's near-black, a step in
      // from the rounded corner
      `${HOST} .pane-title-overlay-layer { --orca-pane-title-bg: ${glass} !important; --orca-pane-title-fg: ${mix(70)} !important; --orca-pane-title-button-fg: ${mix(80)} !important; --orca-pane-title-button-hover-fg: ${n} !important; --orca-pane-title-separator: transparent !important; }`,
      `${HOST} .pane-title-actions { margin-top: 4px !important; margin-right: 6px !important; }`,
      // The focused tile's ring, the two accents round a conic gradient, sweeps once round as the tile takes the
      // focus, then holds (turning for good repainted the whole tile 20 times a second: measured at about 15 points
      // of GPU, the most of anything here)
      `${tile}:focus-within::after { ${ring(2, `conic-gradient(from var(--rice-angle), ${a1}, ${a2}, ${a1})`)} ` +
        'animation: rice-spin 1.4s var(--rice-pop) both; }',
      // With two panes or more, the ones without the focus step back a little
      `${HOST} [data-terminal-layout-leaf-ids]:has(.pane:focus-within) .pane:not(:focus-within) > .xterm-container { opacity: 0.78; }`,
      `${tile} > .xterm-container { transition: opacity 0.16s var(--rice-ease); }`,
      // An agent waiting on you: its tab and its tile breathe amber
      `[data-tab-id][data-agent-activity-status="waiting"], [data-tab-id][data-agent-activity-status="permission"] { ` +
        `box-shadow: inset 0 0 0 1px color-mix(in srgb, ${amber} 75%, transparent), 0 0 14px -4px ${amber} !important; }`,
      `${tile}[data-rice-wait]::after { ${ring(2, amber)} animation: rice-breathe 2.4s ease-in-out infinite !important; }`,
      // A theme change cross-fades the frame instead of snapping (the wallpaper wipes, see wipe()). Only while one is
      // under way (.rice-theming, see theming()): held all the time it made every tab click and hover crawl for 0.6 s.
      // Tiles and tabs no longer ease in as they open: Orca shows a worktree's panes again on every switch, so the
      // fade-in replayed each time and made switching read as lag
      [`[data-tab-group-strip-id]`, `${side} > .titlebar-left`, `${side} > .titlebar-left + div`, tile, status, `[data-tab-id]`].map((x) => `.rice-theming ${x}`).join(', ') +
        ' { transition: background-color 0.6s var(--rice-ease), color 0.6s var(--rice-ease), box-shadow 0.6s var(--rice-ease) !important; }',
      // Between tab groups: Orca's 6 px handle with a grey bar becomes an 8 px gap like the others; the bar shows,
      // in the accent, only under the pointer (it is still the handle that resizes the groups)
      '.tab-group-split-resize-handle.is-vertical { width: 8px !important; min-width: 8px !important; }',
      '.tab-group-split-resize-handle.is-horizontal { height: 8px !important; min-height: 8px !important; }',
      '.tab-group-split-resize-handle::after { background: transparent !important; transition: background-color 0.12s var(--rice-ease); }',
      `.tab-group-split-resize-handle:hover::after { background: color-mix(in srgb, ${a1} 55%, transparent) !important; }`,
      // The sidebar footer's full-width rule ran into the card's rounded sides under the inset list box
      `${side} .border-t.border-worktree-sidebar-border { border-top-color: transparent !important; }`,
      `${HOST} .pane-divider.is-vertical { width: 8px !important; }`,
      `${HOST} .pane-divider.is-horizontal { height: 8px !important; }`,
      `${HOST} .pane-divider:not(:hover):not(.is-dragging)::after { background: transparent !important; }`,
      // The scrollbar handle stood as a full-height line at each tile's edge (an agent's full screen has nothing to
      // scroll); it shows only under the pointer, soft and rounded
      `${HOST} .xterm-slider { background: transparent !important; border-radius: 4px !important; transition: background-color 0.12s var(--rice-ease); }`,
      `${HOST} .pane:hover .xterm-slider { background: color-mix(in srgb, ${n} 22%, transparent) !important; }`,
      // The chat view as clear as the terminal it stands in for: the tile's own tint, the scene sharp behind it (it
      // matches the terminal). Orca draws it over the pane's terminal (absolute, z 10) and leaves that terminal painted
      // under it, inert: hidden while a chat covers it, or its text would show through. Its solid layers (pane shell,
      // root, composer and question wrappers) clear; the user bubble, composer, code and cards are tinted of their own
      `${HOST} .pane:has(.native-chat-pane-shell) > .xterm-container { visibility: hidden !important; }`,
      `.native-chat-pane-shell { background: ${payload.mode === 'off' ? t : `color-mix(in srgb, ${t} 45%, transparent)`} !important; border-radius: inherit; }`,
      '[data-native-chat-root="true"], [data-native-chat-root] > div.shrink-0.bg-background { background: transparent !important; }',
      `[data-native-chat-root] .rounded-tr-sm.bg-muted { background: color-mix(in srgb, ${a1} ${light ? 12 : 16}%, color-mix(in srgb, ${t} 55%, transparent)) !important; ` +
        `box-shadow: inset 0 0 0 1px ${edge}; }`,
      // The composer sits on the shell's glass already: tinted only, no second blur (a nested backdrop filter is redrawn
      // with every frame of the scene behind it)
      `[data-native-chat-root] [data-native-file-drop-target="composer"] { background: color-mix(in srgb, ${t} ${light ? 78 : 66}%, transparent) !important; }`,
      `[data-native-chat-root] .bg-accent { background: color-mix(in srgb, ${n} ${light ? 7 : 9}%, transparent) !important; }`,
      `[data-native-chat-root] .bg-card, [data-native-chat-root] [data-native-chat-approval-card] { background: color-mix(in srgb, ${t} ${light ? 82 : 72}%, transparent) !important; ` +
        `box-shadow: inset 0 0 0 1px ${edge}; }`,
      `[data-native-chat-root] [data-native-chat-turn-status] { border-bottom-color: ${edge} !important; }`,
      `${status} { margin: 8px !important; border-radius: 12px !important; border-top-color: transparent !important; background: ${glass} !important; ` +
        `box-shadow: ${lift}, inset 0 0 0 1px ${edge} !important; }`,
    ].join('\n')
  }

  // The chat view, read the way T3 Code and MonoCode read (any shape; the glass is cardsRule's): a 46rem column, the
  // user's messages as soft bubbles in the accent's tint and the replies as open prose, a lifted composer that rings in
  // the accent when focused, the transcript fading out under its top and bottom edges, a shimmer across whatever is
  // running instead of Orca's blinking pulse, a turn's end as a hairline divider, tools as chips, failures in the
  // theme's red. Arrivals (new rows, a reply's new paragraphs, a fold opening) are marked by watchChats and rise in
  // here. Only colour, radius and opacity/transform animations: nothing that makes Orca's list measure rows again
  function chatRule() {
    const C = '[data-native-chat-root]'
    const a1 = payload?.accent?.[0] ?? 'var(--ring)'
    const red = payload?.signal?.[2] ?? 'var(--destructive)'
    const fg = (p) => `color-mix(in srgb, var(--foreground) ${p}%, transparent)`
    const edge = fg(12)
    const lift = '0 1px 2px rgba(0, 0, 0, 0.18), 0 6px 16px -8px rgba(0, 0, 0, 0.45)'
    const live = [`${C} [data-native-chat-tool-run-state="live"] > span.animate-pulse`, `${C} [data-native-chat-turn-activity] > span`, `${C} [data-native-chat-turn-status="active"] > span`].join(', ')
    return [
      '@keyframes rice-rise { from { opacity: 0; transform: translateY(8px); } }',
      '@keyframes rice-unfold { from { opacity: 0; transform: translateY(-4px); } }',
      '@keyframes rice-land { from { opacity: 0; transform: translateY(3px); } }',
      '@keyframes rice-shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }',
      // 1. The reading column (transcript, task list and composer share it); Orca's newer column marker too
      `${C} .max-w-4xl, ${C} [data-native-chat-transcript-column] { max-width: 46rem !important; }`,
      // 2. The user's bubble, its tail where Orca puts it (top right); the reply as prose, a touch more air and softer
      `${C} .rounded-tr-sm.bg-muted { border-radius: 18px 6px 18px 18px !important; padding: 10px 15px !important; line-height: 1.55; ` +
        `background: color-mix(in srgb, ${a1} 14%, var(--muted)) !important; box-shadow: inset 0 0 0 1px ${edge}; }`,
      `${C} .select-text.leading-relaxed:not(.italic):not(.text-xs) { line-height: 1.7 !important; color: ${fg(92)}; }`,
      // 3. The composer: rounder, lifted, the accent ring as it takes focus
      `${C} [data-native-file-drop-target="composer"] { border-radius: 16px !important; border-color: transparent !important; ` +
        `box-shadow: ${lift}, inset 0 0 0 1px ${edge} !important; transition: box-shadow 0.18s var(--rice-ease); }`,
      `${C} [data-native-file-drop-target="composer"]:focus-within { box-shadow: ${lift}, inset 0 0 0 1px color-mix(in srgb, ${a1} 60%, transparent), ` +
        `0 0 0 3px color-mix(in srgb, ${a1} 16%, transparent) !important; }`,
      // 4. Arrivals: a new row rises in, a fold's body unfolds under its button, a reply's new paragraph lands
      `${C} [data-index][data-rice-new] > * { animation: rice-rise 0.36s var(--rice-pop) both; }`,
      `${C} [data-rice-opening] > button[aria-expanded="true"] ~ * { animation: rice-unfold 0.22s var(--rice-pop) both; }`,
      `${C} [data-rice-in] { animation: rice-land 0.42s var(--rice-ease) both; }`,
      // 5. Whatever is running shimmers: a band of the accent sweeping across muted text
      `${live} { animation: rice-shimmer 1.6s linear infinite !important; opacity: 1 !important; color: transparent !important; ` +
        `background: linear-gradient(90deg, var(--muted-foreground) 0 38%, color-mix(in srgb, ${a1} 70%, var(--foreground)) 50%, var(--muted-foreground) 62% 100%); ` +
        'background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; }',
      // 6. A turn's end, a hairline with its time in the middle
      `${C} [data-native-chat-turn-status] { border-bottom: 0 !important; justify-content: center; gap: 10px !important; font-size: 12px !important; min-height: 28px !important; }`,
      `${C} [data-native-chat-turn-status]::before, ${C} [data-native-chat-turn-status]::after { content: ''; flex: 1; height: 1px; }`,
      `${C} [data-native-chat-turn-status]::before { background: linear-gradient(90deg, transparent, ${edge}); }`,
      `${C} [data-native-chat-turn-status]::after { background: linear-gradient(90deg, ${edge}, transparent); }`,
      // 7. The transcript fades out under its edges (Orca leaves 40 px over the first row; 24 under the last)
      `${C} [data-native-chat-scroll] { -webkit-mask-image: linear-gradient(to bottom, transparent, #000 22px, #000 calc(100% - 22px), transparent); ` +
        'mask-image: linear-gradient(to bottom, transparent, #000 22px, #000 calc(100% - 22px), transparent); }',
      `${C} [data-native-chat-scroll] > .pb-4 { padding-bottom: 24px !important; }`,
      // 8. Tools as chips: a run as a pill, each tool's name as a tag, code and diffs as rounded cards, failures red
      `${C} [data-native-chat-tool-run-state] { width: fit-content !important; max-width: 100%; padding: 2px 10px 2px 8px !important; border-radius: 999px !important; ` +
        `background: ${fg(5)}; box-shadow: inset 0 0 0 1px ${edge}; transition: background-color 0.12s var(--rice-ease); }`,
      `${C} [data-native-chat-tool-run-state]:hover { background: ${fg(9)}; }`,
      `${C} [data-native-chat-tool-run-state] > span { max-width: none !important; flex-shrink: 1 !important; min-width: 0; }`,
      `${C} [data-native-chat-tool-run-state] > span[aria-label] { color: ${red} !important; }`,
      `${C} [class~="group/tool-line"] > code { padding: 1px 6px; border-radius: 6px; background: ${fg(8)}; font-weight: 500 !important; }`,
      `${C} pre.text-destructive { color: ${red} !important; background: color-mix(in srgb, ${red} 10%, transparent) !important; }`,
      `${C} [class~="group/code"], ${C} div.rounded-md.border:has(> [class~="group/diff-card"]) { border-radius: 10px !important; border-color: ${edge} !important; box-shadow: inset 0 0 0 1px ${edge}; }`,
      `${C} [class~="group/code"] > .border-b { border-bottom-color: ${edge} !important; }`,
      `${C} button.rounded-full[class~="bg-card/90"] { box-shadow: ${lift}, inset 0 0 0 1px ${edge} !important; border-color: transparent !important; }`,
      `@media (prefers-reduced-motion: reduce) { ${C} [data-rice-new] > *, ${C} [data-rice-opening] > button ~ *, ${C} [data-rice-in] { animation: none !important; } ` +
        `${live} { animation: none !important; color: var(--foreground) !important; background: none !important; } }`,
    ].join('\n')
  }

  // Orca's Match Terminal sidebar, at full strength: the same variables Orca sets on it, worked out from the
  // terminal colours without the opacity. Left alone when it is opaque already, Default or Tinted. As a tile it is
  // frosted glass instead: the same colours at 72%, the scene blurred behind (cardsRule)
  function sidebarRule(tc) {
    sidebar = false
    const glass = payload?.shape === 'cards'
    if (!tc || (!tc.translucent && !glass)) return ''
    const { el } = tc
    const t = glass ? `color-mix(in srgb, ${tc.t} 72%, transparent)` : tc.t
    // Orca draws the sidebar's labels at 55-60% of its text colour; on a light theme with soft text that falls under
    // 3:1, so the text is taken a quarter of the way to black there
    const n = isLight(tc.t) ? `color-mix(in srgb, ${tc.n} 72%, #000)` : tc.n
    const mix = (p) => `color-mix(in srgb, ${n} ${p}%, ${t})`
    const want = {
      '--worktree-sidebar': t, '--worktree-sidebar-foreground': n, '--worktree-sidebar-accent': mix(9),
      '--worktree-sidebar-accent-foreground': n, '--worktree-sidebar-border': mix(7), '--worktree-sidebar-ring': mix(44),
      '--sidebar': t, '--sidebar-foreground': n, '--sidebar-accent': mix(9), '--sidebar-accent-foreground': n,
      '--sidebar-border': mix(7), '--sidebar-ring': mix(44), '--background': t, '--foreground': n, '--card': mix(4),
      '--card-foreground': n, '--accent': mix(9), '--accent-foreground': n, '--muted': mix(7), '--muted-foreground': mix(mutedPct(tc.t)),
      '--border': mix(7),
    }
    // Only what Orca itself set there
    const set = [...el.style].filter((name) => name in want)
    if (set.length === 0) return ''
    sidebar = true
    return `${SIDEBAR} { ${set.map((name) => `${name}: ${want[name]} !important;`).join(' ')} }`
  }

  // The retro themes' CRT, as Ghostty's scenes/fx/crt.glsl draws it: faint scanlines and a soft vignette laid over
  // each pane, and the text glowing in its own light (a drop shadow on xterm's canvas, whose background is clear)
  function crtRule(n) {
    const k = Number(payload?.crt) || 0
    if (k <= 0) return ''
    const pane = `${HOST} [data-terminal-layout-leaf-ids] .pane`
    return [
      `${pane}::before { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 29; ` +
        `background: repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0, 0, 0, ${(0.16 * k).toFixed(3)}) 2px 3px), ` +
        `radial-gradient(ellipse at center, transparent 62%, rgba(0, 0, 0, ${(0.24 * k).toFixed(3)}) 100%); }`,
      // No glow here: a drop shadow on xterm's canvas is filtered again on every repaint of the text (measured at 7 to
      // 17 points of GPU while agents print); Ghostty's shader glows it for nothing
    ].join('\n')
  }

  function css() {
    // Tiles carry their own background, so the terminal area stays clear for the gaps between them
    const fill = payload.mode === 'off' && payload.shape !== 'cards' ? terminalBg() : 'transparent'
    const rules = [`${HOST} .xterm-viewport { background: transparent !important; }`, MOTION, FEEL]
    if (fill) rules.push(`${HOST} [data-terminal-layout-leaf-ids] { background: ${fill} !important; }`)
    const tc = terminalColours()
    rules.push(sidebarRule(tc), frameRule(tc), chatRule(), cardsRule(tc?.t ?? terminalBg(), tc?.n ?? payload.fg ?? '#fafafa'), crtRule(tc?.n ?? payload.fg ?? '#fafafa'))
    return rules.filter(Boolean).join('\n')
  }

  function restyle() {
    if (style === null) {
      style = document.createElement('style')
      style.className = 'rice-scene-style'
      document.head.appendChild(style)
    }
    const text = css()
    if (style.textContent !== text) style.textContent = text
  }

  function compile(type, src) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(s)).slice(0, 300))
    return s
  }

  function build() {
    if (prog !== null) gl.deleteProgram(prog.p)
    for (const r of res) r.kind === 'buf' ? gl.deleteBuffer(r.it) : gl.deleteTexture(r.it)
    prog = null
    res = []
    const p = gl.createProgram()
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VS))
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, PRE + payload.shader + POST))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(p)).slice(0, 300))
    gl.useProgram(p)
    const buf = gl.createBuffer()
    res.push({ kind: 'buf', it: buf })
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(p, 'a')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    // The "terminal" main.glsl composites over is one pixel of the background, so the scene fills the rectangle
    const tex = gl.createTexture()
    res.push({ kind: 'tex', it: tex })
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    const bg = payload.bg.map((c) => Math.round(c * 255))
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([...bg, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.uniform1i(gl.getUniformLocation(p, 'iChannel0'), 0)
    gl.uniform3fv(gl.getUniformLocation(p, 'iBackgroundColor'), payload.bg)
    prog = {
      p,
      res: gl.getUniformLocation(p, 'iResolution'),
      time: gl.getUniformLocation(p, 'iTime'),
      off: gl.getUniformLocation(p, 'uOff'),
      h: gl.getUniformLocation(p, 'uH'),
      rad: gl.getUniformLocation(p, 'uRad'),
      scale: gl.getUniformLocation(p, 'uScale'),
      lights: gl.getUniformLocation(p, 'uLights'),
      lightN: gl.getUniformLocation(p, 'uLightN'),
      col: gl.getUniformLocation(p, 'uCol'),
      ripple: gl.getUniformLocation(p, 'uRipple'),
      dpr: gl.getUniformLocation(p, 'uDpr'),
    }
  }

  // The agents, read from Orca's own tabs (data-agent-activity-status): where each one's light sits (by its tab's id,
  // so lights keep their place), and what each was last, so a working agent that stops sends out a ripple
  const STATE = { working: 1, monitoring: 1, waiting: 2, permission: 2, blocked: 2, done: 3, failed: 4, interrupted: 4 }
  const lastState = new Map()
  let ripple = null
  let boostUntil = 0
  // A still scene's last frame: the agents' lights it showed, and whether a ripple was running in it
  let stillSig = ''
  let rippled = false
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296 }
  function agentTabs() {
    const out = []
    for (const tab of document.querySelectorAll('[data-tab-id][data-agent-activity-status]')) {
      const id = tab.getAttribute('data-tab-id')
      const s = STATE[tab.getAttribute('data-agent-activity-status')] ?? 0
      const was = lastState.get(id)
      lastState.set(id, s)
      const h = hash(id), v = hash(id + '/y')
      const at = { x: innerWidth * (0.06 + 0.88 * h), y: innerHeight * (0.07 + 0.36 * v), s, phase: h * 6.283 }
      if (was === 1 && s !== 1) {
        ripple = { x: at.x, y: at.y, t: performance.now(), kind: s === 2 ? 2 : 3 }
        boostUntil = ripple.t + 1700
      }
      out.push(at)
    }
    return out.slice(0, 16)
  }
  // The colours: resting is the text colour, working the first accent, then amber, mint and red from the theme
  function agentColours() {
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    const sig = payload.signal ?? ['#ffb347', '#7ee6b8', '#ff5c8a']
    return [payload.fg ?? '#ffffff', (payload.accent ?? [payload.fg ?? '#ffffff'])[0], ...sig].flatMap(hex)
  }
  function setAgents(tabs, dpr, H, T, L) {
    const flat = new Float32Array(64)
    tabs.forEach((a, i) => flat.set([(a.x - L) * dpr, H - (a.y - T) * dpr, a.s, a.phase], i * 4))
    gl.uniform4fv(prog.lights, flat)
    gl.uniform1i(prog.lightN, tabs.length)
    gl.uniform3fv(prog.col, agentColours())
    gl.uniform1f(prog.dpr, dpr)
    const age = ripple ? (performance.now() - ripple.t) / 1000 : -1
    gl.uniform4f(prog.ripple, ripple ? (ripple.x - L) * dpr : 0, ripple ? H - (ripple.y - T) * dpr : 0, age < 1.6 ? age : -1, ripple ? ripple.kind : 0)
  }
  // A tile whose tab's agent waits on you breathes amber: the tab bars and the panes are drawn apart in Orca, so
  // the tile under a bar whose active tab waits is found by where it sits, and marked with an attribute of ours
  function markWaiting() {
    const waitBars = [...document.querySelectorAll('[data-tab-group-strip-id]')]
      .filter((b) => b.querySelector('[data-tab-id][data-active="true"][data-agent-activity-status="waiting"], [data-tab-id][data-active="true"][data-agent-activity-status="permission"]'))
      .map((b) => b.getBoundingClientRect())
    // Nobody waiting (nearly always): no pane is measured, which would make the page lay itself out 10 times a second
    if (waitBars.length === 0) {
      for (const pane of document.querySelectorAll('[data-rice-wait]')) pane.removeAttribute('data-rice-wait')
      return
    }
    for (const pane of document.querySelectorAll(`${HOST} [data-terminal-layout-leaf-ids] .pane`)) {
      const r = pane.getBoundingClientRect()
      const under = r.width > 0 && waitBars.some((b) => r.left >= b.left - 2 && r.right <= b.right + 2 && r.top >= b.bottom - 2)
      if (under !== pane.hasAttribute('data-rice-wait')) under ? pane.setAttribute('data-rice-wait', '') : pane.removeAttribute('data-rice-wait')
    }
  }

  // An attribute of ours for as long as its animation runs, then gone: React moving the element later must not replay it
  function stamp(el, name, ms) {
    el.setAttribute(name, '')
    clearTimeout(el.__riceT?.[name])
    el.__riceT = { ...el.__riceT, [name]: setTimeout(() => el.removeAttribute(name), ms) }
  }

  // The chat view's arrivals (chatRule animates them). Orca's transcript keeps only the rows in view (data-index, in
  // order): a row past the highest index seen yet is a message arriving and rises in; rows coming back as the list
  // scrolls, or there when a chat opens, stand still, and a jump of more than a few (older history loaded above) is
  // taken as it is. Just after a fold opens, rows it brings in rise too. In the reply being written (the last row while
  // the agent works) each new paragraph, list item or code block lands as it appears; text growing inside one does not
  // touch the page (only elements added are seen)
  const BLOCK = /^(P|LI|UL|OL|PRE|BLOCKQUOTE|H[1-6]|TABLE|HR|DIV)$/
  const chatMax = new WeakMap()
  let chatToggleAt = 0
  let liveRow = null
  const liveWatch = new MutationObserver((list) => {
    for (const m of list) for (const n of m.addedNodes) if (n.nodeType === 1 && BLOCK.test(n.tagName)) stamp(n, 'data-rice-in', 500)
  })
  const rowWatch = new MutationObserver((list) => {
    const wins = new Set(list.map((m) => m.target))
    for (const win of wins) {
      const max = chatMax.get(win) ?? -1
      const opening = performance.now() - chatToggleAt < 400
      let top = max
      for (const m of list) {
        if (m.target !== win) continue
        for (const row of m.addedNodes) {
          const i = row.nodeType === 1 ? Number(row.getAttribute('data-index')) : NaN
          if (!Number.isFinite(i)) continue
          if ((i > max && i <= max + 3) || opening) stamp(row, 'data-rice-new', 600)
          if (i > top) top = i
        }
      }
      chatMax.set(win, top)
    }
    followLive()
  })
  const watchedWins = new WeakSet()
  function followLive() {
    let next = null
    for (const win of document.querySelectorAll('[data-native-chat-root][data-native-chat-working="true"] [data-native-chat-window]')) {
      const last = win.lastElementChild
      if (last && Number(last.getAttribute('data-index')) >= (chatMax.get(win) ?? 0)) next = last
    }
    if (next === liveRow) return
    liveWatch.disconnect()
    liveRow = next
    if (next) liveWatch.observe(next, { childList: true, subtree: true })
  }
  function watchChats() {
    for (const win of document.querySelectorAll('[data-native-chat-window]')) {
      if (watchedWins.has(win)) continue
      watchedWins.add(win)
      let max = -1
      for (const row of win.children) max = Math.max(max, Number(row.getAttribute('data-index')) || 0)
      chatMax.set(win, max)
      rowWatch.observe(win, { childList: true })
    }
    followLive()
  }

  // The cursor trail (Ghostty's scenes/fx/cursor-trail.glsl, here in 2D): xterm keeps its input box on the cursor's
  // cell, so when that box jumps right after a key or a click the jump is drawn as a smear from the old cell to the
  // new, head in the first accent, tail in the second, gone in 160 ms. Output moving the cursor on its own (an
  // agent's screen redrawing) draws nothing
  let trailCanvas = null
  let trailAt = 0
  let lastInput = 0
  const watched = new WeakMap()
  // A key or a click: where the focused terminal's cursor is now, so the jump it causes can be drawn from there; and
  // a chat fold opening (see watchChats)
  const onInput = (e) => {
    lastInput = performance.now()
    const ta = document.activeElement
    if (payload?.trail && ta && watched.has(ta)) watched.set(ta, ta.getBoundingClientRect())
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return
    const fold = e.target instanceof Element ? e.target.closest('[data-native-chat-root] button[aria-expanded]') : null
    if (fold?.parentElement) {
      chatToggleAt = lastInput
      stamp(fold.parentElement, 'data-rice-opening', 450)
    }
  }
  // Agents move the cursor with every line they print: those moves are not measured at all (each measure made the
  // page lay itself out again mid-print); only the ones just after a key or a click are
  const cursorWatch = new MutationObserver((list) => {
    for (const m of list) {
      if (!payload?.trail || performance.now() - lastInput > 300) continue
      const ta = m.target
      const r = ta.getBoundingClientRect()
      const prev = watched.get(ta)
      watched.set(ta, r)
      if (!prev || r.width < 1) continue
      const dx = r.left - prev.left, dy = r.top - prev.top
      if (Math.hypot(dx, dy) < r.width * 1.6) continue
      trailFrom(prev, r)
    }
  })
  function watchCursors() {
    if (!payload?.trail) return
    for (const ta of document.querySelectorAll(`${HOST} .xterm-helper-textarea`)) {
      if (watched.has(ta)) continue
      watched.set(ta, ta.getBoundingClientRect())
      cursorWatch.observe(ta, { attributes: true, attributeFilter: ['style'] })
    }
  }
  // The convex hull of the two cells' corners (monotone chain): the smear's outline
  function hullOf(pts) {
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    const half = (list) => {
      const h = []
      for (const q of list) {
        while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop()
        h.push(q)
      }
      h.pop()
      return h
    }
    return [...half(p), ...half([...p].reverse())]
  }

  function trailFrom(a, b) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (trailCanvas === null) {
      trailCanvas = document.createElement('canvas')
      trailCanvas.className = 'rice-cursor-trail'
      trailCanvas.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000;'
      document.body.appendChild(trailCanvas)
    }
    const dpr = devicePixelRatio || 1
    trailCanvas.width = Math.round(innerWidth * dpr)
    trailCanvas.height = Math.round(innerHeight * dpr)
    const g = trailCanvas.getContext('2d')
    const [c1, c2] = payload.accent ?? [payload.fg ?? '#ffffff', payload.fg ?? '#ffffff']
    const bg = Array.isArray(payload.bg) ? payload.bg : [0, 0, 0]
    const light = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2] > 0.5
    const start = performance.now()
    trailAt = start
    const ease = (t, p) => 1 - Math.pow(1 - t, p)
    const corners = (r, x, y) => [r.left + x * r.width, r.top + y * r.height]
    const frame = () => {
      if (trailAt !== start || trailCanvas === null) return
      const t = Math.min(1, (performance.now() - start) / 160)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, innerWidth, innerHeight)
      if (t < 1) {
        // The head reaches the new cell first, the tail follows it in
        const h = ease(t, 4), k = ease(t, 1.6)
        const at = (u) => ({ left: a.left + (b.left - a.left) * u, top: a.top + (b.top - a.top) * u, width: b.width, height: b.height })
        // The tail narrows to a third of the cell, so the smear tapers like a comet
        const head = at(h), full = at(k)
        const tail = { left: full.left + full.width / 3, top: full.top + full.height / 3, width: full.width / 3, height: full.height / 3 }
        const pts = []
        for (const [x, y] of [[0, 0], [1, 0], [1, 1], [0, 1]]) pts.push(corners(tail, x, y), corners(head, x, y))
        const hull = hullOf(pts)
        const grad = g.createLinearGradient(tail.left, tail.top, head.left, head.top)
        grad.addColorStop(0, c2)
        grad.addColorStop(1, c1)
        g.globalAlpha = (light ? 0.3 : 0.55) * (1 - t)
        g.globalCompositeOperation = light ? 'multiply' : 'lighter'
        g.fillStyle = grad
        g.beginPath()
        hull.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)))
        g.closePath()
        g.fill()
        requestAnimationFrame(frame)
      } else {
        // Done: the full-window canvas gives its memory back (about 33 MB on this screen) until the next jump
        trailCanvas.width = 0
        trailCanvas.height = 0
      }
    }
    // The first frame at once: the smear starts on the jump, not a frame later
    frame()
  }

  // A theme change: the frame's colours cross-fade while it lands (css(), .rice-theming), then answer at once again
  let themingTimer = 0
  function theming() {
    document.documentElement.classList.add('rice-theming')
    clearTimeout(themingTimer)
    themingTimer = setTimeout(() => document.documentElement.classList.remove('rice-theming'), 900)
  }

  // A new scene wipes in over the old (swww's wipe, as Omarchy switches wallpapers): the old frame copied into a
  // canvas laid over the scene's, its mask sweeping away corner to corner, then gone
  function wipe() {
    if (!canvas || canvas.width < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.querySelectorAll('.rice-scene-wipe').forEach((e) => e.remove())
    const old = document.createElement('canvas')
    old.className = 'rice-scene-wipe'
    old.width = canvas.width
    old.height = canvas.height
    old.getContext('2d').drawImage(canvas, 0, 0)
    const s = canvas.style
    Object.assign(old.style, { left: s.left, top: s.top, width: s.width, height: s.height, zIndex: s.zIndex })
    canvas.after(old)
    old.addEventListener('animationend', () => old.remove(), { once: true })
    setTimeout(() => old.remove(), 2000)
  }

  function dropCanvas() {
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    canvas?.remove()
    canvas = gl = prog = null
    res = []
    key = ''
    drawn = false
  }

  function teardown() {
    clearInterval(timer)
    timer = 0
    cursorWatch.disconnect()
    rowWatch.disconnect()
    liveWatch.disconnect()
    liveRow = null
    document.querySelectorAll('[data-rice-new], [data-rice-in], [data-rice-opening]').forEach((e) => ['data-rice-new', 'data-rice-in', 'data-rice-opening'].forEach((a) => e.removeAttribute(a)))
    document.removeEventListener('keydown', onInput, true)
    document.removeEventListener('pointerdown', onInput, true)
    trailCanvas?.remove()
    trailCanvas = null
    document.querySelectorAll('.rice-scene-wipe').forEach((e) => e.remove())
    document.querySelectorAll('[data-rice-wait]').forEach((e) => e.removeAttribute('data-rice-wait'))
    dropCanvas()
    style?.remove()
    style = null
    sidebar = false
    frame = false
    cards = false
  }

  // The corners of a host that meet a rounded, clipping ancestor's: [bottom left, bottom right, top right, top left]
  function radiiOf(h, r) {
    for (let a = h.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a)
      if (cs.overflow === 'visible') continue
      const rad = [cs.borderBottomLeftRadius, cs.borderBottomRightRadius, cs.borderTopRightRadius, cs.borderTopLeftRadius].map((v) => parseFloat(v) || 0)
      if (rad.every((v) => v === 0)) continue
      const ar = a.getBoundingClientRect()
      const near = (x1, y1, x2, y2) => Math.abs(x1 - x2) < 2.5 && Math.abs(y1 - y2) < 2.5
      return [
        near(r.left, r.bottom, ar.left, ar.bottom) ? rad[0] : 0,
        near(r.right, r.bottom, ar.right, ar.bottom) ? rad[1] : 0,
        near(r.right, r.top, ar.right, ar.top) ? rad[2] : 0,
        near(r.left, r.top, ar.left, ar.top) ? rad[3] : 0,
      ]
    }
    return [0, 0, 0, 0]
  }

  function tick() {
    if (payload === null) return
    restyle()
    watchCursors()
    markWaiting()
    watchChats()
    // A ripple runs at 30 frames a second; the rest of the time 10 is plenty
    const every = performance.now() < boostUntil ? 33 : 100
    if (timer && timerMs !== every) {
      clearInterval(timer)
      timer = setInterval(tick, every)
      timerMs = every
    }
    if (payload.mode === 'off') {
      if (canvas) dropCanvas()
      return
    }
    // Tiles: the scene is the wallpaper of the whole window, under everything; otherwise only under the terminals
    const wall = cards
    // The wallpaper covers the window whatever shows: the terminals are measured only for Orca's own shape
    const hosts = wall ? [] : visibleHosts()
    if (hosts.length === 0 && !wall) {
      if (canvas) canvas.style.display = 'none'
      return
    }
    if (canvas === null) {
      canvas = document.createElement('canvas')
      canvas.className = 'rice-scene-layer'
      canvas.style.cssText = 'position:fixed;pointer-events:none;margin:0;padding:0;border:0;'
      document.body.appendChild(canvas)
      // A GPU reset loses the context: drop the canvas and let the next tick make a new one
      canvas.addEventListener('webglcontextlost', () => {
        canvas?.remove()
        canvas = gl = prog = null
        res = []
        key = ''
        drawn = false
      })
      gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' })
      if (gl === null) {
        err = 'no webgl2'
        dropCanvas()
        payload = { mode: 'off', bg: payload.bg }
        return
      }
    }
    const want = `${payload.theme}:${payload.mode}:${payload.hash}`
    if (key !== want) {
      if (key !== '' && drawn) wipe()
      key = want
      try {
        build()
        err = null
      } catch (e) {
        err = String(e.message ?? e)
      }
      drawn = false
    }
    if (prog === null) {
      canvas.style.display = 'none'
      return
    }
    // One canvas over all the visible hosts, one step under the lowest of them
    const rects = wall ? [{ left: 0, top: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight }] : hosts.map((h) => h.getBoundingClientRect())
    const radii = wall ? [[0, 0, 0, 0]] : hosts.map((h, i) => radiiOf(h, rects[i]))
    const L = Math.min(...rects.map((r) => r.left))
    const T = Math.min(...rects.map((r) => r.top))
    const R = Math.max(...rects.map((r) => r.right))
    const B = Math.max(...rects.map((r) => r.bottom))
    const z = wall ? -1 : Math.min(...hosts.map((h) => parseInt(getComputedStyle(h).zIndex, 10)).map((n) => (Number.isFinite(n) ? n - 1 : -1)))
    const dpr = devicePixelRatio || 1
    const FW = Math.max(1, Math.round((R - L) * dpr))
    const FH = Math.max(1, Math.round((B - T) * dpr))
    // The wallpaper is pixel art in blocks of main.glsl's px (its height over 170, 3 to 7 pixels): one fragment a
    // block, scaled up square by the browser, draws the same picture for a fortieth of the work. Under the
    // terminals (Orca's own shape) every pixel still counts, for the rounded corners
    const k = wall ? Math.max(3, Math.min(7, Math.floor(FH / 170))) : 1
    const W = Math.ceil(FW / k)
    const H = Math.ceil(FH / k)
    const s = canvas.style
    if (s.imageRendering !== (k > 1 ? 'pixelated' : '')) s.imageRendering = k > 1 ? 'pixelated' : ''
    const box = `${L}px,${T}px,${R - L}px,${B - T}px,${z},${radii.flat().join('/')}`
    let moved = false
    if (canvas.dataset.box !== box) {
      Object.assign(s, { left: `${L}px`, top: `${T}px`, width: `${R - L}px`, height: `${B - T}px`, zIndex: String(z) })
      canvas.dataset.box = box
      moved = true
    }
    if (s.display === 'none') {
      s.display = ''
      moved = true
    }
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W
      canvas.height = H
      moved = true
    }
    const live = document.hasFocus() && !document.hidden
    if (!live && drawn && !moved) return
    const tabs = wall && payload.agents !== false ? agentTabs() : []
    // Still: the scene and the agents' lights stand at STILL_T, so a frame is drawn only when it would differ: a
    // move, an agent changing state, a ripple running, and the frame after one to clear it
    if (payload.mode === 'still') {
      const sig = tabs.map((a) => `${Math.round(a.x)},${Math.round(a.y)},${a.s}`).join(' ')
      const rippling = performance.now() < boostUntil
      if (drawn && !moved && !rippling && !rippled && sig === stillSig) return
      stillSig = sig
      rippled = rippling
    }
    gl.disable(gl.SCISSOR_TEST)
    gl.viewport(0, 0, W, H)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.SCISSOR_TEST)
    gl.useProgram(prog.p)
    gl.uniform1f(prog.time, payload.mode === 'still' ? STILL_T : (performance.now() - t0) / 1000)
    gl.uniform1f(prog.scale, k)
    for (const [i, r] of rects.entries()) {
      // In the canvas's own pixels (a block each when k > 1); the shader sees full-size coordinates (uScale)
      const x = Math.round(((r.left - L) * dpr) / k)
      const w = Math.ceil((r.width * dpr) / k)
      const h = Math.ceil((r.height * dpr) / k)
      const y = H - Math.round(((r.top - T) * dpr) / k) - h
      gl.viewport(x, y, w, h)
      gl.scissor(x, y, w, h)
      gl.uniform3f(prog.res, k > 1 ? FW : w, k > 1 ? FH : h, 1)
      gl.uniform2f(prog.off, x, y)
      gl.uniform1f(prog.h, k > 1 ? FH : h)
      gl.uniform4fv(prog.rad, radii[i].map((v) => v * dpr))
      setAgents(tabs, dpr, FH, T, L)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    drawn = true
  }

  function report() {
    const x = [...document.querySelectorAll(`${HOST} .xterm`)].find((e) => e.getBoundingClientRect().width > 0)
    const bg = x ? getComputedStyle(x).backgroundColor : ''
    // rgb(...) is opaque: Orca's Background Opacity is 1 and the scene cannot show through the text area
    return {
      v: V,
      mode: payload?.mode ?? 'off',
      theme: payload?.theme,
      hosts: visibleHosts().length,
      drawn,
      opaque: /^rgb\(/.test(bg),
      terminalBg: terminalBg(),
      sidebar,
      frame,
      cards,
      // Terminals whose text is wider than their tile (a refit Orca missed)
      overflow: [...document.querySelectorAll(`${HOST} .xterm`)].filter((x) => {
        const sc = x.querySelector('.xterm-screen')
        return sc && x.getBoundingClientRect().width > 0 && sc.getBoundingClientRect().right > x.parentElement.getBoundingClientRect().right + 1
      }).length,
      error: err,
    }
  }

  window.__riceScene = {
    v: V,
    apply(p) {
      const bgOk = p && Array.isArray(p.bg) && p.bg.length === 3
      const ok = p && ['on', 'dim', 'still', 'off'].includes(p.mode) && (p.mode === 'off' || (typeof p.shader === 'string' && bgOk))
      const was = payload && payload.theme
      payload = ok ? { ...p } : { mode: 'off' }
      if (was && payload.theme && payload.theme !== was) theming()
      if (!bgOk) delete payload.bg
      payload.shape = p && p.shape === 'cards' ? 'cards' : 'square'
      if (!(p && typeof p.fg === 'string' && /^#[0-9a-f]{6}$/i.test(p.fg))) delete payload.fg
      if (!(p && Array.isArray(p.accent) && p.accent.length === 2 && p.accent.every((c) => /^#[0-9a-f]{6}$/i.test(c)))) delete payload.accent
      payload.trail = !!(p && p.trail !== false)
      if (!(p && Array.isArray(p.signal) && p.signal.length === 3 && p.signal.every((c) => /^#[0-9a-f]{6}$/i.test(c)))) delete payload.signal
      payload.agents = !(p && p.agents === false)
      payload.crt = p && typeof p.crt === 'number' && p.crt > 0 && p.crt <= 1 ? p.crt : 0
      if (payload.mode !== 'off') {
        // FNV-1a of the shader, so a new theme or strength rebuilds the program
        let h = 0x811c9dc5
        for (let i = 0; i < payload.shader.length; i++) h = Math.imul(h ^ payload.shader.charCodeAt(i), 0x01000193)
        payload.hash = (h >>> 0).toString(16)
      }
      // The timer runs in every mode: the sidebar and the fill follow Orca's own changes (a theme, a new tab)
      if (!timer) {
        timer = setInterval(tick, 100)
        document.addEventListener('keydown', onInput, true)
        document.addEventListener('pointerdown', onInput, true)
      }
      tick()
      return report()
    },
    status: report,
    // One still frame of a theme's scene at the given size, as a PNG data URL (a preview or a wallpaper).
    // A canvas and context of its own, gone after; the agents' lights and ripples are left out
    still(p, w, h) {
      if (!(p && typeof p.shader === 'string' && Array.isArray(p.bg) && w > 0 && h > 0 && w <= 8192 && h <= 8192)) return null
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const g = c.getContext('webgl2', { alpha: false, preserveDrawingBuffer: true })
      if (!g) return null
      try {
        const sh = (type, src) => {
          const x = g.createShader(type)
          g.shaderSource(x, src)
          g.compileShader(x)
          if (!g.getShaderParameter(x, g.COMPILE_STATUS)) throw new Error(String(g.getShaderInfoLog(x)).slice(0, 200))
          return x
        }
        const pr = g.createProgram()
        g.attachShader(pr, sh(g.VERTEX_SHADER, VS))
        g.attachShader(pr, sh(g.FRAGMENT_SHADER, PRE + p.shader + POST))
        g.linkProgram(pr)
        if (!g.getProgramParameter(pr, g.LINK_STATUS)) throw new Error(String(g.getProgramInfoLog(pr)).slice(0, 200))
        g.useProgram(pr)
        const buf = g.createBuffer()
        g.bindBuffer(g.ARRAY_BUFFER, buf)
        g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW)
        const loc = g.getAttribLocation(pr, 'a')
        g.enableVertexAttribArray(loc)
        g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0)
        const tex = g.createTexture()
        g.activeTexture(g.TEXTURE0)
        g.bindTexture(g.TEXTURE_2D, tex)
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([...p.bg.map((v) => Math.round(v * 255)), 255]))
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST)
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST)
        const u = (n) => g.getUniformLocation(pr, n)
        g.uniform1i(u('iChannel0'), 0)
        g.uniform3fv(u('iBackgroundColor'), p.bg)
        g.uniform3f(u('iResolution'), w, h, 1)
        g.uniform1f(u('iTime'), STILL_T)
        g.uniform2f(u('uOff'), 0, 0)
        g.uniform1f(u('uH'), h)
        g.uniform4f(u('uRad'), 0, 0, 0, 0)
        g.uniform1f(u('uScale'), 1)
        g.uniform1i(u('uLightN'), 0)
        g.uniform4f(u('uRipple'), 0, 0, -1, 0)
        g.uniform1f(u('uDpr'), 1)
        g.viewport(0, 0, w, h)
        g.drawArrays(g.TRIANGLES, 0, 3)
        return c.toDataURL('image/png')
      } finally {
        g.getExtension('WEBGL_lose_context')?.loseContext()
      }
    },
    dispose() {
      payload = null
      clearTimeout(themingTimer)
      document.documentElement.classList.remove('rice-theming')
      teardown()
      delete window.__riceScene
    },
  }
})()
