// Tokyo Night: a city in the rain. Far towers with blinking aircraft lights, near ones hung with neon signs.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.08);
  vec3 c = sky(p, hz, R.y, K4, 0.1);

  // far towers, tall and thin
  float w1 = 7.0;
  float b1 = floor((p.x + 3.0) / w1);
  float tall = h1(int(b1) + 5) * h1(int(b1) + 6);
  float top1 = hz + floor(R.y * (0.1 + 0.34 * tall));
  if (p.y < top1) c = ink(U_MUTED, 0.24);
  if (tall > 0.45 && p.y == top1 && mod(p.x + 3.0, w1) == 3.0 && fract(t * 0.5 + h1(int(b1))) < 0.4) c = ink(K1, 0.55);

  // near towers, darker, some with a vertical neon sign
  float w2 = 11.0 + floor(h1(int(floor(p.x / 23.0)) + 2) * 6.0);
  float b2 = floor(p.x / w2);
  float top2 = hz + floor(R.y * (0.05 + 0.16 * h1(int(b2) + 33)));
  if (p.y < top2) {
    c = mix(BG, U_DEEP, 0.9);
    float lx = mod(p.x, w2);
    if (lx > 1.0 && lx < w2 - 2.0 && mod(p.y, 4.0) == 1.0 && h2(p + vec2(0.0, floor(t / 13.0) * 7.0)) < 0.06) c = ink(K3, 0.22);
    float has = h1(int(b2) + 71);
    if (has < 0.5) {
      float len = 7.0 + floor(h1(int(b2) + 72) * 9.0);
      float y0 = top2 - 3.0 - len;
      float sx = 2.0 + floor(has * 2.0 * (w2 - 6.0));
      if (lx >= sx && lx < sx + 2.0 && p.y >= y0 && p.y < y0 + len && mod(p.y - y0, 3.0) != 2.0) {
        vec3 nc = has < 0.17 ? K5 : has < 0.34 ? K6 : K1;
        float off = h1(int(floor(t * 6.0)) + int(b2) * 13) < 0.05 ? 0.3 : 1.0;
        c = ink(nc, 0.4 * off);
      }
    }
  }

  // wet street: the signs smear into it
  if (p.y < hz) {
    c = mix(BG, U_DEEP, 0.6);
    if (ripples(p, hz, t * 3.0, 0.12, 2) > 0.0) c = ink(K5, 0.12);
  }

  c = over(c, U_LAVENDER, rain(p, R, t, 0.06, 30.0, 0.3, 4.0, 1) * 0.15);
  c = over(c, U_LAVENDER, rain(p, R, t, 0.04, 22.0, 0.3, 3.0, 2) * 0.09);
  return c;
}
