// Gruvbox: desert dusk. A banded sun sinking behind flat-topped mesas, heat shimmer, saguaros, a few birds.

bool cactus(vec2 p, float x0, float ground, float h, float flip) {
  vec2 q = vec2((p.x - x0) * flip, p.y - ground);
  if (q.y < 0.0 || q.y >= h) return false;
  if (q.x >= 0.0 && q.x < 2.0) return true;
  float a = floor(h * 0.45);
  if (q.y >= a && q.y < a + 2.0 && q.x >= 2.0 && q.x < 5.0) return true;
  if (q.x >= 4.0 && q.x < 6.0 && q.y >= a && q.y < a + floor(h * 0.35)) return true;
  float b = floor(h * 0.3);
  if (q.y >= b && q.y < b + 2.0 && q.x >= -3.0 && q.x < 0.0) return true;
  return q.x >= -4.0 && q.x < -2.0 && q.y >= b && q.y < b + floor(h * 0.3);
}

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.14);
  vec3 c = sky(p, hz, R.y * 0.8, K3, 0.18);
  c = over(c, K3, stars(p, 0.0015, t, 7) * 0.18 * smoothstep(R.y * 0.5, R.y * 0.8, p.y));

  // the sun, half down, cut by bands
  float sr = floor(clamp(R.y * 0.12, 10.0, 24.0));
  vec2 sc = vec2(floor(R.x * 0.3), hz + floor(sr * 0.25));
  if (p.y >= hz && disc(p, sc, sr)) {
    float y = p.y - sc.y;
    bool cut = y < sr * 0.4 && fract((y + 40.0) / 5.0) < 0.3 - 0.3 * y / sr;
    if (!cut) c = ink(mix(K1, K3, dq((y + sr) / (2.0 * sr), 4.0, p)), 0.27);
  }

  // far mesas: flat tops in steps, shimmering near the ground
  float sx = p.x + (p.y < hz + 6.0 ? floor(sin(p.y * 1.3 + t * 4.0) * 0.8 + 0.5) : 0.0);
  float mesa = hz + floor(floor(fbm(sx * 0.012, 21) * 5.0 - 1.4) * R.y * 0.04);
  if (p.y < mesa) c = ink(K1, 0.12);

  // near dunes and the ground, darker
  float dune = hz - 2.0 + floor(5.0 * fbm(p.x * 0.01, 22));
  if (p.y < dune) c = mix(BG, vec3(0.0), 0.22);
  if (cactus(p, floor(R.x * 0.12), dune - 1.0, floor(R.y * 0.1), 1.0) || cactus(p, floor(R.x * 0.78), dune - 1.0, floor(R.y * 0.07), -1.0) || cactus(p, floor(R.x * 0.9), dune - 1.0, floor(R.y * 0.045), 1.0))
    c = mix(BG, vec3(0.0), 0.32);

  // birds gliding across
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 b = vec2(mod(t * (2.5 + fi * 0.6) + fi * 140.0, R.x + 40.0) - 20.0, R.y * (0.5 + 0.06 * fi) + sin(t * 0.4 + fi) * 2.0);
    if (bird(p, b, t, fi * 0.33)) c = ink(U_MUTED, 0.5);
  }
  return c;
}
