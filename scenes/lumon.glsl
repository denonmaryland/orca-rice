// Lumon: macrodata refinement. A quiet, sparse field of numbers that bob in place; now and then a cluster
// turns scary, grows bright and jitters, then settles.

vec3 scene(vec2 p, vec2 R, float t) {
  vec3 c = BG;
  float base = floor(R.y * 0.16);
  float fade = smoothstep(R.y * 0.98, R.y * 0.6, p.y) * smoothstep(base, base + 24.0, p.y);
  vec2 cell = floor(vec2(p.x / 9.0, (p.y - base) / 11.0));
  float h = h2(cell + vec2(3.0, 7.0));

  // the scary cluster, a new one every 12 seconds
  float n = floor(t / 12.0);
  float k = t / 12.0 - n;
  vec2 bin = floor(vec2(h1(int(n) * 2 + 1) * R.x / 9.0, (0.3 + 0.4 * h1(int(n) * 2 + 2)) * (R.y - base) / 11.0));
  float scare = smoothstep(0.0, 0.2, k) * smoothstep(0.55, 0.3, k) * smoothstep(3.5, 1.0, length(cell - bin));

  vec2 bob = vec2(scare > 0.1 ? floor(h2(cell + floor(t * 8.0)) * 3.0) - 1.0 : 0.0, floor(sin(t * 0.8 + h * 6.28) + 0.5));
  vec2 q = p - vec2(cell.x * 9.0 + 3.0, base + cell.y * 11.0 + 3.0) - bob;
  if (fract(h * 7.31) < 0.55 + 0.45 * scare && digit(int(h * 10.0), q)) c = ink(K4, (0.065 + 0.24 * scare) * fade);

  return c;
}
