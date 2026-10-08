// Ristretto: a campfire under the stars. Flames flicker, sparks rise and fade, the tent catches the glow.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.17);
  vec3 c = sky(p, hz, R.y, K4, 0.07);
  c = over(c, K3, stars(p, 0.003, t, 12) * 0.26);
  c = over(c, K3, meteor(p, R, t, 29.0, 5) * 0.4);

  // a thin crescent moon
  vec2 mc = vec2(floor(R.x * 0.16), floor(R.y * 0.74));
  float mr = floor(clamp(R.y * 0.04, 5.0, 9.0));
  if (disc(p, mc, mr) && !disc(p, mc + vec2(mr * 0.45, mr * 0.2), mr * 0.9)) c = ink(K3, 0.3);

  // far hills, the near ground
  float hill = ridge(p.x, hz, R.y * 0.12, 0.009, 41);
  if (p.y < hill) c = ink(K4, 0.11);
  float ground = hz - 1.0 + floor(3.0 * fbm(p.x * 0.02, 42));
  if (p.y < ground) c = mix(BG, vec3(0.0), 0.25);

  // the fire, its glow on the ground, the tent beside it
  vec2 f = vec2(floor(R.x * 0.42), ground - 3.0);
  float gd = length((p - f) * vec2(0.5, 1.4));
  float flick = 0.75 + 0.25 * vn(t * 6.0, 3);
  if (gd < 34.0) c = over(c, K4, dq(0.18 * flick * (1.0 - gd / 34.0), 6.0 / 0.18, p));
  vec2 tc = vec2(f.x - 22.0, ground);
  float tw = 15.0;
  float th = 14.0;
  float tdx = abs(p.x - tc.x);
  if (p.y >= ground - 1.0 && p.y - ground < th - tdx * th / tw) {
    c = ink(K4, 0.09);
    if (p.x > tc.x + tdx * 0.0 && p.x < tc.x + 3.0 && p.y < ground + 5.0 - (p.x - tc.x)) c = ink(K4, 0.22 * flick);
    if (tdx < 1.0 || p.x > tc.x + tw - 3.0 - (p.y - ground) * tw / th) c = over(c, K4, 0.1 * flick);
  }
  // logs
  if ((p.y == f.y - 1.0 || p.y == f.y - 2.0) && abs(p.x - f.x) < 6.0 - (f.y - p.y)) c = ink(K1, 0.2);
  // flames: core gold, edge orange, shifting
  float fh = 9.0 + floor(vn(t * 5.0, 3) * 6.0);
  float dy = p.y - f.y;
  if (dy >= 0.0 && dy < fh) {
    float u = dy / fh;
    float w = (1.0 - u) * 4.5 + 0.5;
    float x = abs(p.x - f.x - floor(sin(dy * 0.9 + t * 9.0) * 0.8 + 0.5));
    if (x <= w) c = ink(x < w * 0.45 && u < 0.6 ? K3 : u > 0.7 ? K1 : K4, 0.5 - 0.15 * u);
  }
  // sparks rising
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float life = fract(t * (0.18 + 0.05 * h1(i + 9)) + h1(i));
    vec2 s = floor(f + vec2(sin(life * 5.0 + fi) * 6.0 * life, fh + life * R.y * 0.3));
    if (p == s) c = ink(K3, 0.55 * (1.0 - life));
  }
  return c;
}
