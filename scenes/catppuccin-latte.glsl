// Catppuccin Latte: a morning with a hot air balloon. Clouds drift, the balloon bobs, green hills below.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.16);
  vec3 c = ink(K4, dq(0.06 * clamp((p.y - hz) / (R.y - hz), 0.0, 1.0), 6.0 / 0.06, p));
  c = over(c, K3, dq(0.05 * (1.0 - clamp((p.y - hz) / (R.y * 0.25), 0.0, 1.0)), 6.0 / 0.05, p));

  // the sun, soft, top left
  vec2 sc = vec2(floor(R.x * 0.14), floor(R.y * 0.8));
  float sr = floor(clamp(R.y * 0.05, 5.0, 11.0));
  float d = length(p - sc);
  if (d <= sr) c = ink(K3, 0.24);
  else if (d < sr * 2.2) c = over(c, K3, dq(0.07 * (1.0 - (d - sr) / (sr * 1.2)), 6.0 / 0.07, p));

  // clouds: whiter than the sky, shaded underneath
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 cc = vec2(mod(h1(i + 13) * R.x + t * (1.0 + 0.4 * fi), R.x + 100.0) - 50.0, floor(R.y * (0.42 + 0.12 * fi)));
    if (cloud(p, cc, 18.0 + 7.0 * fi, 6.0 + 2.0 * fi, i + 30)) c = p.y - cc.y < 2.0 ? ink(U_MUTED, 0.16) : mix(BG, vec3(1.0), 0.8);
  }

  // the balloon: striped envelope, tapered to the basket, two ropes
  vec2 b = floor(vec2(R.x * 0.62 + sin(t * 0.08) * 10.0, R.y * 0.46 + sin(t * 0.3) * 3.0));
  float br = floor(clamp(R.y * 0.05, 6.0, 11.0));
  vec2 q = p - b;
  bool env = q.y >= -br * 0.3 ? dot(q, q) <= br * br : abs(q.x) <= (q.y + br * 1.25) * 0.95 && q.y >= -br * 1.25;
  if (env) c = ink(mod(floor((q.x + br) / 3.0), 2.0) == 0.0 ? K1 : K5, 0.36);
  float by = -br * 1.25;
  if (q.y < by && q.y >= by - 3.0 && abs(q.x) == 2.0 - floor((by - q.y) / 3.0) * 0.0 && q.y > by - 2.0) c = ink(U_MUTED, 0.5);
  if (q.y <= by - 2.0 && q.y >= by - 4.0 && abs(q.x) <= 1.0) c = ink(K3, 0.45);

  // birds
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    vec2 bb = vec2(mod(t * (2.0 + fi) + fi * 200.0, R.x + 40.0) - 20.0, R.y * (0.62 + 0.05 * fi));
    if (bird(p, bb, t, fi * 0.4)) c = ink(U_MUTED, 0.55);
  }

  // three rows of hills
  if (p.y < ridge(p.x, hz, R.y * 0.08, 0.006, 81)) c = ink(K6, 0.1);
  if (p.y < ridge(p.x, hz - 3.0, R.y * 0.06, 0.009, 82)) c = ink(K2, 0.14);
  if (p.y < ridge(p.x, hz - 8.0, R.y * 0.05, 0.012, 83)) c = ink(K2, 0.22);
  return c;
}
