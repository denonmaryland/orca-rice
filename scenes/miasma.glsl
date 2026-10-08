// Miasma: marsh lights. Dead trees in the fog, reeds at the water, wisps of light drifting and fading.

bool deadTree(vec2 p, vec2 b, float h, int seed) {
  vec2 q = p - b;
  if (q.y < 0.0 || q.y > h || abs(q.x) > h * 0.6) return false;
  float lean = (h1(seed) - 0.5) * 0.25;
  if (abs(q.x - floor(q.y * lean)) < 1.0) return true;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float y0 = h * (0.4 + 0.15 * fi);
    vec2 s = vec2(floor(y0 * lean), y0);
    vec2 dir = normalize(vec2(mod(fi, 2.0) == 0.0 ? -1.0 : 1.0, 0.7 + 0.5 * h1(seed + i)));
    float L = h * (0.35 - 0.06 * fi);
    vec2 v = q - s;
    float along = dot(v, dir);
    float across = abs(v.x * dir.y - v.y * dir.x);
    if (along > 0.0 && along < L && across < 0.6) return true;
  }
  return false;
}

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.16);
  vec3 c = sky(p, hz, R.y, K6, 0.05);
  vec2 mc = vec2(floor(R.x * 0.7), floor(R.y * 0.62));
  if (disc(p, mc, floor(R.y * 0.08))) c = ink(U_LAVENDER, 0.06);

  float far = hz + floor(R.y * 0.04 * fbm(p.x * 0.05, 71)) + 2.0;
  if (p.y < far) c = ink(K4, 0.08);

  float dark = 0.34;
  if (deadTree(p, vec2(floor(R.x * 0.14), hz - 2.0), floor(R.y * 0.26), 3) ||
      deadTree(p, vec2(floor(R.x * 0.36), hz), floor(R.y * 0.15), 4) ||
      deadTree(p, vec2(floor(R.x * 0.86), hz - 1.0), floor(R.y * 0.21), 5))
    c = mix(BG, vec3(0.0), dark);

  if (p.y < hz) {
    c = mix(BG, vec3(0.0), 0.12);
    if (ripples(p, hz, t * 0.6, 0.06, 7) > 0.0) c = ink(U_LAVENDER, 0.07);
  }
  // reeds along the waterline
  float rh = 2.0 + floor(h1(int(p.x) + 300) * 7.0);
  float sway = floor(sin(t * 0.8 + p.x * 0.2) * 0.8 * (p.y - hz) / rh + 0.5);
  if (h1(int(p.x - sway) + 301) < 0.35 && p.y >= hz - 2.0 && p.y < hz - 2.0 + rh) c = ink(K4, 0.13);

  // fog in two drifting layers
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float f = fbm2(vec2(p.x * 0.02 + t * (0.12 + 0.08 * fi), p.y * 0.09), 72 + i);
    float band = exp(-pow((p.y - hz - 6.0 - fi * 16.0) / 7.0, 2.0));
    c = over(c, U_LAVENDER, dq(0.11 * smoothstep(0.4, 0.75, f) * band, 6.0 / 0.11, p));
  }

  // wisps
  float w = fireflies(p, vec2(R.x * 0.05, hz + 2.0), vec2(R.x * 0.95, hz + R.y * 0.22), t * 0.6, 4, 9);
  c = over(c, K6, w * 0.55);
  return c;
}
