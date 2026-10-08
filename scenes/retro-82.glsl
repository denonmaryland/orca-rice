// Retro 82: a night drive. A striped sun over dark mountains, palms by the road, the centre line coming at you.

bool palm(vec2 p, vec2 base, float h, float t, float lean) {
  vec2 q = p - base;
  if (q.y < 0.0 || q.y > h + 5.0 || abs(q.x) > h * 0.6) return false;
  float u = q.y / h;
  float sway = sin(t * 0.6 + base.x) * 0.8;
  float tx = floor(lean * u * u * 4.0 + sway * u + 0.5);
  if (q.y < h && abs(q.x - tx) < 1.0) return true;
  vec2 top = vec2(floor(lean * 4.0 + sway + 0.5), h);
  vec2 f = q - top;
  float L = h * 0.42;
  if (abs(f.x) > L) return false;
  float droop = -(f.x * f.x) / (L * 1.1) + 1.0;
  if (abs(f.y - floor(droop)) < 0.6) return true;
  if (abs(f.x) < L * 0.55 && abs(f.y - floor(abs(f.x) * 0.55 + 1.0)) < 0.6) return true;
  return false;
}

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.22);
  vec3 c = sky(p, hz, R.y, K3, 0.15);
  c = over(c, U_HI, stars(p, 0.0025, t, 15) * 0.22 * smoothstep(R.y * 0.45, R.y * 0.75, p.y));

  // the sun
  float sr = floor(clamp(R.y * 0.14, 12.0, 28.0));
  vec2 sc = vec2(floor(R.x * 0.5), hz + floor(sr * 0.55));
  if (p.y >= hz && disc(p, sc, sr)) {
    float u = (p.y - (sc.y - sr)) / (2.0 * sr);
    float y = sc.y - p.y;
    bool cut = y > -2.0 && fract((y + t * 1.0) / 5.0) < 0.2 + 0.4 * max(y, 0.0) / sr;
    if (!cut) c = ink(mix(K1, U_VIOLET, dq(u, 4.0, p)), 0.3);
  }

  // mountains with a teal rim
  float m = ridge(p.x, hz, R.y * 0.11, 0.018, 51) - R.y * 0.035 * (1.0 - smoothstep(0.0, R.x * 0.25, abs(p.x - sc.x)));
  if (p.y >= hz && p.y < m) c = mix(BG, U_DEEP, 0.95);
  if (p.y >= hz && p.y == floor(m)) c = ink(K6, 0.2);

  // the road to the vanishing point, its centre line rushing in; the grid either side
  if (p.y < hz) {
    float d = hz - p.y;
    float hw = d / hz * R.x * 0.32 + 1.0;
    float dx = abs(p.x - R.x * 0.5);
    if (dx < hw) {
      c = mix(BG, U_DEEP, 0.7);
      if (abs(dx - hw + 1.0) < 1.0) c = ink(U_HI, 0.2);
      float z = 30.0 / d;
      if (dx < 0.5 + d * 0.012 && fract(z - t * 1.2) < 0.45) c = ink(U_HI, 0.22 * smoothstep(1.0, 8.0, d));
    } else {
      c = over(c, K2, gridFloor(p, R, hz, t, 1.2) * 0.13);
    }
  }

  // palms on the horizon
  float ph = floor(R.y * 0.14);
  if (palm(p, vec2(floor(R.x * 0.1), hz), ph, t, -1.0) || palm(p, vec2(floor(R.x * 0.2), hz), floor(ph * 0.75), t, 1.0) ||
      palm(p, vec2(floor(R.x * 0.82), hz), ph, t, 1.0) || palm(p, vec2(floor(R.x * 0.92), hz), floor(ph * 0.8), t, -1.0))
    c = mix(BG, vec3(0.0), 0.35);
  return c;
}
