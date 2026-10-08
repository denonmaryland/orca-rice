// Catppuccin: moonlit rooftops. Clouds drift over the moon; a cat sits on a ridge, tail going, eyes blinking.

// The cat, 9×8, rows bottom to top, bit 8 the leftmost column; two frames of tail
const int CAT_A[8] = int[](252, 253, 249, 240, 192, 448, 448, 320);
const int CAT_B[8] = int[](255, 252, 248, 240, 192, 448, 448, 320);

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.1);
  vec3 c = sky(p, hz, R.y, K4, 0.08);
  c = over(c, K3, stars(p, 0.003, t, 4) * 0.28);

  // moon, a soft halo, a crater or two
  vec2 mc = vec2(floor(R.x * 0.2), floor(R.y * 0.68));
  float mr = floor(clamp(R.y * 0.055, 6.0, 12.0));
  float d = length(p - mc);
  if (d > mr && d < mr * 2.6) c = ink(U_LAVENDER, dq(0.07 * (1.0 - (d - mr) / (mr * 1.6)), 6.0 / 0.07, p));
  if (d <= mr) {
    c = ink(U_HI, 0.32);
    if (disc(p, mc + vec2(-mr * 0.3, mr * 0.25), mr * 0.25) || disc(p, mc + vec2(mr * 0.35, -mr * 0.3), mr * 0.18)) c = ink(U_HI, 0.25);
  }

  // clouds drifting right
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 cc = vec2(mod(h1(i + 3) * R.x + t * (1.2 + 0.5 * fi), R.x + 90.0) - 45.0, floor(R.y * (0.58 + 0.12 * fi)));
    if (cloud(p, cc, 22.0 + 8.0 * fi, 6.0 + 2.0 * fi, i + 20)) c = ink(U_LAVENDER, p.y - cc.y < 1.0 ? 0.05 : 0.09);
  }

  // houses: a wall, a pitched roof, sometimes a chimney, a few warm windows
  float gap = 26.0;
  float cell = floor(p.x / gap);
  float catCell = floor(R.x * 0.62 / gap);
  for (int k = -1; k <= 1; k++) {
    float ci = cell + float(k);
    float w = 16.0 + floor(h1(int(ci) + 61) * 12.0);
    float x0 = ci * gap - 4.0 + floor(h1(int(ci) + 62) * 6.0);
    float wall = hz + 7.0 + floor(h1(int(ci) + 63) * R.y * 0.08);
    float cx = x0 + w * 0.5;
    float peak = wall + floor(w * 0.36);
    float dx = abs(p.x + 0.5 - cx);
    bool inWall = p.x >= x0 && p.x < x0 + w && p.y < wall;
    bool inRoof = p.y >= wall && dx <= (peak - p.y) / 0.72 && dx < w * 0.5 + 1.0;
    float chx = x0 + floor(w * 0.72);
    bool inChimney = h1(int(ci) + 64) < 0.5 && p.x >= chx && p.x < chx + 3.0 && p.y >= wall && p.y < peak - 1.0;
    if (inWall) {
      c = ink(U_TRACK, 0.9);
      vec2 wq = vec2(p.x - x0, p.y - hz);
      if (mod(wq.x, 5.0) > 2.0 && mod(wq.x, 5.0) < 5.0 && mod(wq.y, 6.0) > 2.0 && wq.y < wall - hz - 2.0 && wq.x > 2.0 && wq.x < w - 2.0) {
        float lit = h2(vec2(floor(wq.x / 5.0) + ci * 9.0, floor(wq.y / 6.0) + floor(t / 17.0)));
        if (lit < 0.22) c = ink(K3, 0.3);
      }
    }
    if (inRoof || inChimney) c = ink(mix(U_TRACK, U_LAVENDER, 0.12), 0.95);
    // the cat, on one ridge
    if (ci == catCell) {
      vec2 q = p - vec2(floor(cx) - 4.0, peak);
      if (q.x >= 0.0 && q.x < 9.0 && q.y >= 0.0 && q.y < 8.0) {
        int row = fract(t / 2.4) < 0.5 ? CAT_A[int(q.y)] : CAT_B[int(q.y)];
        if (((row >> (8 - int(q.x))) & 1) == 1) c = ink(mix(U_TRACK, U_LAVENDER, 0.12), 0.95);
        if (q == vec2(1.0, 5.0) && fract(t / 5.0) > 0.04) c = ink(K2, 0.6);
      }
    }
  }
  if (p.y < hz) c = ink(U_TRACK, 0.9);
  return c;
}
