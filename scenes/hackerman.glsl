// Hackerman: signal rain. Sparse streams of glyphs fall, bright at the head; a wire terrain scrolls below.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.12);
  vec3 c = sky(p, hz, R.y, K2, 0.05);

  // glyph streams on a 4×6 grid
  float gx = floor(p.x / 4.0);
  float gy = floor(p.y / 6.0);
  float h = h1(int(gx) + 201);
  if (h < 0.13 && p.y > hz) {
    float k = h / 0.13;
    float rows = ceil(R.y / 6.0);
    float tail = 6.0 + floor(k * 14.0);
    float head = mod(-t * (2.0 + 4.0 * fract(k * 7.3)) + k * 97.0, rows + tail + 8.0);
    float d = gy - floor(head);
    if (d >= 0.0 && d < tail) {
      vec2 l = mod(p, vec2(4.0, 6.0));
      if (l.x < 3.0 && l.y < 5.0) {
        int bits = int(h2(vec2(gx, gy + floor(t * 1.5 + k * 10.0))) * 32767.0);
        int bit = int(l.y) * 3 + int(l.x);
        if (((bits >> bit) & 1) == 1) c = d < 1.0 ? ink(U_HI, 0.42) : ink(K1, 0.26 * (1.0 - d / tail));
      }
    }
  }

  // wire terrain
  if (p.y < hz) {
    float lift = floor(3.0 * fbm(p.x * 0.03 + 7.0, 4));
    c = over(c, K2, gridFloor(p + vec2(0.0, lift), R, hz, t, 0.25) * 0.12);
  }
  if (p.y == hz) c = ink(K2, 0.16);
  return c;
}
