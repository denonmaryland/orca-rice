// Osaka Jade: a bamboo grove under a pale moon. The stalks sway at the top; leaves come down now and then.

vec3 scene(vec2 p, vec2 R, float t) {
  vec3 c = sky(p, 0.0, R.y, K6, 0.05);
  c = over(c, U_HI, stars(p, 0.0016, t, 13) * 0.18);

  vec2 mc = vec2(floor(R.x * 0.5), floor(R.y * 0.6));
  float mr = floor(clamp(R.y * 0.09, 8.0, 18.0));
  float d = length(p - mc);
  if (d <= mr) c = ink(U_HI, 0.16);
  else if (d < mr * 1.9) c = over(c, U_HI, dq(0.05 * (1.0 - (d - mr) / (mr * 0.9)), 6.0 / 0.05, p));

  // stalks: dense at the sides, open in the middle; nodes every so often; the tops sway
  float gap = 9.0;
  float cell = floor(p.x / gap);
  for (int k = -1; k <= 1; k++) {
    float ci = cell + float(k);
    float h = h1(int(ci) + 81);
    float side = abs((ci * gap) / R.x - 0.5);
    if (h > smoothstep(0.24, 0.46, side) * 0.9) continue;
    bool near = h1(int(ci) + 82) < 0.45;
    float w = near ? 3.0 : 2.0;
    float u = p.y / R.y;
    float sway = floor(sin(t * 0.45 + h * 6.28) * 2.0 * u * u + 0.5);
    float x0 = ci * gap + floor(h1(int(ci) + 83) * (gap - w)) + sway;
    if (p.x >= x0 && p.x < x0 + w) {
      float seg = 13.0 + floor(h * 8.0);
      bool node = mod(p.y + floor(h * 30.0), seg) < 1.0;
      c = ink(near ? K2 : K3, (near ? 0.13 : 0.07) + (node ? 0.05 : 0.0));
    }
    // a few leaves off the nodes
    float seg2 = 13.0 + floor(h * 8.0);
    float ny = p.y + floor(h * 30.0);
    float ly = mod(ny, seg2);
    float lx = p.x - (x0 + w);
    if (u > 0.3 && ly < 4.0 && lx >= 0.0 && lx < 6.0 && floor(lx * 0.5) == 3.0 - ly - (mod(floor(ny / seg2), 2.0) == 0.0 ? 1.0 : 0.0) && h2(vec2(ci, floor(ny / seg2))) < 0.5)
      c = ink(K3, near ? 0.12 : 0.07);
  }

  // falling leaves
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float y = mod(h1(i + 60) * R.y - t * (3.0 + fi * 0.4), R.y + 10.0) - 5.0;
    float x = h1(i + 70) * R.x + sin(t * 0.7 + fi) * 6.0;
    vec2 q = p - floor(vec2(x, y));
    bool tilt = sin(t * 0.7 + fi) > 0.0;
    if (q == vec2(0.0) || q == (tilt ? vec2(1.0, 1.0) : vec2(-1.0, 1.0))) c = ink(K3, 0.3);
  }
  return c;
}
