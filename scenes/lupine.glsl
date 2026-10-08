// Lupine: a meadow of lupines below far mountains. The spikes sway in the wind; two butterflies wander.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.24);
  vec3 c = ink(K4, dq(0.05 * clamp((p.y - hz) / (R.y - hz), 0.0, 1.0), 6.0 / 0.05, p));
  float mtn = ridge(p.x, hz, R.y * 0.14, 0.01, 101);
  if (p.y < mtn) c = ink(K5, 0.07);
  if (p.y < mtn && p.y > hz + R.y * 0.1) c = ink(K5, 0.04);
  if (p.y < hz) c = ink(K5, 0.04);

  // three rows of flower spikes, nearer ones lower and taller
  for (int r = 0; r < 3; r++) {
    float fr = float(r);
    float ground = hz - 2.0 - fr * floor(R.y * 0.07);
    float gap = 5.0 + fr * 2.0;
    float hmax = 6.0 + fr * 6.0;
    float cell = floor(p.x / gap);
    for (int k = -1; k <= 1; k++) {
      float ci = cell + float(k);
      float h = h1(int(ci) * 7 + r * 1000 + 3);
      if (h > 0.75) continue;
      float fh = floor(hmax * (0.6 + 0.4 * h1(int(ci) + r * 50)));
      float y = p.y - ground;
      if (y < 0.0 || y >= fh) continue;
      float u = y / fh;
      float x0 = ci * gap + floor(h * gap * 0.8) + floor(sin(t * 0.9 + ci * 0.4) * 1.3 * u + 0.5);
      float dx = abs(p.x - x0);
      vec3 col = h < 0.25 ? K5 : h < 0.45 ? K2 : h < 0.6 ? U_PINK : K1;
      if (u < 0.35) { if (dx < 0.5) c = ink(K5, 0.14 + 0.05 * fr); }
      else if (dx <= floor((1.0 - u) * (1.0 + fr * 0.6) + 0.5) && mod(p.x + p.y, 2.0) == 0.0 || dx < 0.5) c = ink(col, (0.18 + 0.06 * fr) * (1.0 - 0.4 * u));
    }
  }

  // butterflies
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    vec2 b = floor(vec2(R.x * vn(t * 0.04 + fi * 10.0, 7 + i), hz + R.y * 0.18 * vn(t * 0.06 + fi * 4.0, 9 + i)));
    vec2 q = p - b;
    bool open = fract(t * 2.0 + fi * 0.5) < 0.5;
    if ((open && abs(q.x) == 1.0 && abs(q.y) <= 0.0) || (!open && q.x == 0.0 && q.y == 1.0) || q == vec2(0.0)) c = ink(K1, 0.4);
  }
  return c;
}
