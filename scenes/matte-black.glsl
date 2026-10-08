// Matte Black: almost nothing. A horizon, distant lights, a radio mast with a slow red beacon, dust in the air.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.13);
  vec3 c = sky(p, hz, R.y * 0.6, U_MUTED, 0.06);
  if (p.y < hz) c = mix(BG, vec3(0.0), 0.3);
  if (p.y == hz) c = ink(U_MUTED, 0.22);
  if (p.y == hz + 1.0 && h1(int(p.x) + 500) < 0.06) c = ink(K3, 0.16 * twinkle(h1(int(p.x)), t * 0.3));

  // the mast: tapering lattice, cross-braced
  vec2 b = vec2(floor(R.x * 0.8), hz + 1.0);
  float mh = floor(R.y * 0.3);
  float y = p.y - b.y;
  if (y >= 0.0 && y < mh) {
    float w = floor(4.0 * (1.0 - y / mh) + 1.0);
    float dx = p.x - b.x;
    bool edge = abs(abs(dx) - w) < 0.5;
    bool brace = abs(dx) < w && abs(mod(y + dx, 8.0) - 4.0) < 0.5;
    if (edge || brace) c = ink(U_MUTED, 0.3);
  }
  // the beacon
  vec2 bk = b + vec2(0.0, mh);
  float pulse = exp(-mod(t, 3.0) * 2.2);
  float d = length(p - bk);
  if (d < 0.5) c = ink(K1, 0.2 + 0.6 * pulse);
  else if (d < 2.6) c = over(c, K1, 0.16 * pulse);

  c = over(c, FG, snow(p, t, 14.0, 0.8, 0.22, 8) * 0.1);
  return c;
}
