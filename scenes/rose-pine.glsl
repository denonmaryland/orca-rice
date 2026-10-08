// Rosé Pine Dawn: a lake at sunrise. The sun just up behind iris hills, pines on the far bank, petals drifting.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.2);
  vec3 c = sky(p, hz, R.y * 0.85, K6, 0.12);

  // the sun, half risen, with a ring of light
  float sr = floor(clamp(R.y * 0.07, 7.0, 15.0));
  vec2 sc = vec2(floor(R.x * 0.64), hz + 1.0);
  float d = length(p - sc);
  if (p.y >= hz) {
    if (d <= sr) c = ink(K3, 0.24);
    else if (d < sr * 2.2) c = over(c, K3, dq(0.08 * (1.0 - (d - sr) / (sr * 1.2)), 6.0 / 0.08, p));
  }

  // hills, then pines on the far bank
  float hill = ridge(p.x, hz, R.y * 0.08, 0.008, 31);
  if (p.y >= hz && p.y < hill) c = ink(K5, 0.1);
  if (p.x > R.x * 0.72 && pines(p, hz, 6.0, R.y * 0.05, R.y * 0.15, 32)) c = ink(K2, 0.2);
  if (p.x < R.x * 0.2 && pines(p, hz, 7.0, R.y * 0.04, R.y * 0.11, 33)) c = ink(K2, 0.16);

  // the lake: glints, and a broken path of sunlight under the sun
  if (p.y < hz) {
    c = ink(K4, 0.06);
    float g = ripples(p, hz, t, 0.1, 8);
    if (g > 0.0) c = ink(K6, 0.13);
    float spread = sr * (0.6 + 0.6 * (hz - p.y) / hz);
    if (abs(p.x - sc.x) < spread && ripples(p, hz, t * 1.5, 0.5, 9) > 0.0) c = ink(K3, 0.2);
  }

  // petals
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float x = mod(h1(i + 40) * R.x + t * (4.0 + fi * 0.7), R.x + 20.0) - 10.0;
    float y = mod(h1(i + 50) * R.y - t * (2.5 + 0.5 * fi), R.y);
    vec2 pp = floor(vec2(x + sin(t * 0.9 + fi) * 3.0, y));
    vec2 q = p - pp;
    bool lying = fract(t * 0.6 + fi * 0.3) < 0.5;
    if (q == vec2(0.0) || (lying ? q == vec2(1.0, 0.0) : q == vec2(0.0, 1.0))) c = ink(K1, 0.32);
  }
  return c;
}
