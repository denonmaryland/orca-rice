#!/usr/bin/env node
// Writes a page that draws every theme's scene, still (the frame `scene still` shows) or moving, in any browser with
// WebGL 2. It doubles as a check that every shader compiles: the page title says how many did.
//
//   node scripts/gallery.mjs [--out gallery.html] [--moving]

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { appName } from '../lib/look.mjs'
import { sceneShader, sceneSources } from '../lib/scenes.mjs'
import { THEMES } from '../lib/themes.mjs'

const args = process.argv.slice(2)
const out = resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : 'gallery.html')
const moving = args.includes('--moving')

const scenes = THEMES.map((t) => ({
  id: t.id,
  name: appName(t),
  scene: t.scene,
  bg: t.term.bg,
  fg: t.term.fg,
  accent: t.ui.violet,
  src: sceneShader(t, sceneSources(t), 1, !moving),
}))

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>orca-rice scenes</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 24px; background: #08070b; color: #e8e4f0; font: 14px/1.4 ui-sans-serif, -apple-system, system-ui, sans-serif; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
  p { margin: 0 0 20px; color: #9a93ab; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  figure { margin: 0; border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 0 0 1px #ffffff14; }
  canvas { display: block; width: 100%; aspect-ratio: 16 / 10; image-rendering: pixelated; }
  figcaption { display: flex; justify-content: space-between; gap: 8px; padding: 10px 12px; font-size: 13px; }
  figcaption span:last-child { color: #9a93ab; }
  .err { padding: 12px; color: #ff7a90; font: 12px ui-monospace, monospace; white-space: pre-wrap; }
</style>
</head>
<body>
<h1>orca-rice: ${scenes.length} themes</h1>
<p>Each theme's pixel scene${moving ? ', moving' : ', as "scene still" shows it'}. In Orca it sits behind the terminals and the floating cards.</p>
<main id="grid"></main>
<script>
const SCENES = ${JSON.stringify(scenes)};
const MOVING = ${moving};
const VS = '#version 300 es\\nin vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
const PRE = '#version 300 es\\nprecision highp float; precision highp int;\\nuniform vec3 iResolution; uniform float iTime; uniform sampler2D iChannel0; uniform vec3 iBackgroundColor;\\nout vec4 outColor;\\n';
const POST = '\\nvoid main(){ mainImage(outColor, vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y)); }';
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
// One WebGL canvas draws every scene (a page gets about 16 at a time) and each frame is copied to its tile
const glc = document.createElement('canvas');
glc.width = 480; glc.height = 300;
const gl = glc.getContext('webgl2', { preserveDrawingBuffer: true });
const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
const vs = sh(gl.VERTEX_SHADER, VS);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
let ok = 0;
const items = [];
for (const s of SCENES) {
  const fig = document.createElement('figure');
  const canvas = document.createElement('canvas');
  canvas.width = glc.width; canvas.height = glc.height;
  fig.append(canvas);
  const cap = document.createElement('figcaption');
  cap.innerHTML = '<span></span><span></span>';
  cap.children[0].textContent = s.name;
  cap.children[1].textContent = s.scene;
  fig.append(cap);
  document.getElementById('grid').append(fig);
  try {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, PRE + s.src + POST));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = (n) => gl.getUniformLocation(p, n);
    items.push({ p, bg: rgb(s.bg), loc: gl.getAttribLocation(p, 'a'), u, ctx: canvas.getContext('2d') });
    ok++;
  } catch (e) {
    canvas.remove();
    const err = document.createElement('div');
    err.className = 'err';
    err.textContent = s.id + ': ' + String(e.message || e).slice(0, 400);
    fig.prepend(err);
  }
}
document.title = 'orca-rice scenes: ' + ok + '/' + SCENES.length + ' compiled';
const t0 = performance.now();
function frame() {
  const t = MOVING ? (performance.now() - t0) / 1000 : 0;
  gl.viewport(0, 0, glc.width, glc.height);
  for (const it of items) {
    gl.useProgram(it.p);
    gl.enableVertexAttribArray(it.loc);
    gl.vertexAttribPointer(it.loc, 2, gl.FLOAT, false, 0, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([...it.bg.map((c) => Math.round(c * 255)), 255]));
    gl.uniform1i(it.u('iChannel0'), 0);
    gl.uniform3fv(it.u('iBackgroundColor'), it.bg);
    gl.uniform3f(it.u('iResolution'), glc.width, glc.height, 1);
    gl.uniform1f(it.u('iTime'), t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    it.ctx.drawImage(glc, 0, 0);
  }
  if (MOVING) setTimeout(() => requestAnimationFrame(frame), 100);
}
frame();
</script>
</body>
</html>
`
writeFileSync(out, html)
console.log(`${out}: ${scenes.length} scenes${moving ? ', moving' : ', still'}`)
