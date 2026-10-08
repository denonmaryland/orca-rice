// Flexoki Light: ink mountains on paper. Layered ridges fade into mist at their feet; a red sun; birds pass.

vec3 scene(vec2 p, vec2 R, float t) {
  vec3 c = BG;
  vec2 sc = vec2(floor(R.x * 0.22), floor(R.y * 0.7));
  if (disc(p, sc, floor(clamp(R.y * 0.05, 5.0, 11.0)))) c = ink(K1, 0.32);

  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float base = R.y * (0.36 - 0.08 * fk);
    float amp = R.y * (0.17 - 0.015 * fk);
    float top = base + amp * pow(fbm(p.x * (0.008 + 0.004 * fk) + fk * 13.0, 90 + k), 1.7);
    if (p.y < top) {
      float mist = smoothstep(base - 14.0, base + 10.0, p.y);
      c = ink(FG, dq((0.05 + 0.04 * fk) * mist, 6.0 / (0.05 + 0.04 * fk), p));
    }
  }
  // drifting mist bands
  float f = fbm2(vec2(p.x * 0.015 + t * 0.1, p.y * 0.1), 95);
  c = mix(c, BG, dq(0.5 * smoothstep(0.55, 0.8, f) * exp(-pow((p.y - R.y * 0.2) / 8.0, 2.0)), 6.0, p));

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 b = vec2(R.x + 20.0 - mod(t * (1.8 + 0.3 * fi) + fi * 9.0, R.x + 40.0), R.y * 0.56 + fi * 5.0 + sin(t * 0.3 + fi) * 2.0);
    if (bird(p, b + vec2(fi * 6.0, 0.0), t, fi * 0.3)) c = ink(FG, 0.34);
  }
  return c;
}
