// Ethereal: islands floating in a nebula. They bob slowly; one spills a thin waterfall; sparks drift upward.

vec3 scene(vec2 p, vec2 R, float t) {
  vec3 c = BG;
  float n = fbm2(p * 0.012 + vec2(t * 0.008, 0.0), 41);
  float m = smoothstep(0.5, 0.78, n);
  c = over(c, mix(K4, K5, fbm2(p * 0.02, 42)), dq(0.12 * m, 6.0 / 0.12, p));
  c = over(c, FG, stars(p, 0.003, t, 14) * 0.24);

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 ctr = vec2(R.x * (0.18 + 0.33 * fi + 0.04 * h1(i)), R.y * (0.28 + 0.12 * h1(i + 5) + 0.1 * mod(fi, 2.0)));
    float w = floor(R.y * (0.08 + 0.05 * h1(i + 9)));
    ctr.y += floor(sin(t * 0.35 + fi * 2.0) * 1.5 + 0.5);
    ctr = floor(ctr);
    float dx = (p.x - ctr.x) / w;
    if (abs(dx) < 1.0) {
      float depth = (1.0 - dx * dx) * w * 0.9 * (0.7 + 0.3 * vn(p.x * 0.3, i + 3));
      float y = ctr.y - p.y;
      if (y >= 0.0 && y < depth) c = ink(U_MUTED, mod(y, 4.0) < 1.0 ? 0.16 : 0.22);
      if (y < 0.0 && y > -2.0) c = ink(K2, 0.3);
    }
    // a little pine on each
    float th = floor(w * 0.5);
    float ty = p.y - ctr.y;
    if (ty >= 0.0 && ty < th && abs(p.x - ctr.x - floor(w * 0.3)) <= max((1.0 - ty / th) * th * 0.3, 0.5)) c = ink(K2, 0.24);
    // a waterfall off the middle island
    if (i == 1) {
      float fx = ctr.x + w * 0.62;
      float fy = ctr.y - p.y;
      if (p.x >= fx && p.x < fx + 2.0 && fy > 0.0 && fy < w * 2.0 && mod(p.y + floor(t * 14.0), 4.0) < 2.5)
        c = ink(K4, 0.28 * (1.0 - fy / (w * 2.0)));
    }
  }
  c = over(c, K5, snow(p, t, 12.0, -2.5, 0.25, 7) * 0.28);
  return c;
}
