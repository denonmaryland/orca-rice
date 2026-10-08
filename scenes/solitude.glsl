// Solitude: a lighthouse on a rock at sea. Its beam swings round, flashing when it faces you; the lamp
// glimmers on the water.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.2);
  vec3 c = sky(p, hz, R.y, K4, 0.08);
  c = over(c, FG, stars(p, 0.0028, t, 17) * 0.22);

  if (p.y < hz) {
    c = ink(K4, 0.05);
    if (ripples(p, hz, t, 0.09, 11) > 0.0) c = ink(K4, 0.12);
  }

  // the rock
  vec2 rb = vec2(floor(R.x * 0.76), hz - 3.0);
  float rw = floor(R.y * 0.12);
  float rdx = (p.x - rb.x) / rw;
  float rock = rb.y + floor(R.y * 0.045 * (1.0 - rdx * rdx) * (0.75 + 0.25 * vn(p.x * 0.4, 3)));
  if (abs(rdx) < 1.0 && p.y >= rb.y - 1.0 && p.y < rock) c = mix(BG, vec3(0.0), 0.3);

  // the tower: tapering, striped, a gallery and a lantern room
  float base = rb.y + floor(R.y * 0.045) - 1.0;
  float th = floor(R.y * 0.17);
  float y = p.y - base;
  float dx = p.x - rb.x;
  if (y >= 0.0 && y < th) {
    float w = floor(3.0 - 1.2 * y / th + 0.5);
    if (abs(dx) <= w) c = mod(floor(y / 5.0), 2.0) == 0.0 ? ink(FG, 0.2) : ink(K4, 0.13);
  }
  if (y == th && abs(dx) <= 3.0) c = ink(K4, 0.2);
  vec2 lamp = vec2(rb.x, base + th + 2.0);
  float rot = t * 0.45;
  float facing = pow(max(0.0, sin(rot)), 30.0);
  if (y > th && y <= th + 3.0 && abs(dx) <= 1.0) c = ink(K3, 0.45 + 0.4 * facing);
  if (y > th + 3.0 && y <= th + 5.0 && abs(dx) <= 4.0 - (y - th - 3.0) * 2.0) c = ink(K4, 0.2);

  // the beam, sweeping left and right
  float side = cos(rot);
  vec2 v = p - lamp;
  float along = v.x * sign(side);
  if (along > 2.0) {
    float spread = abs(v.y) / along;
    float reach = R.x * 0.9;
    if (spread < 0.07 && along < reach) c = over(c, K3, dq(0.13 * abs(side) * (1.0 - along / reach) * (1.0 - spread / 0.07), 6.0 / 0.13, p));
  }
  if (length(v) < 6.0) c = over(c, K3, 0.12 * facing);

  // the lamp on the water
  if (p.y < hz && abs(p.x - rb.x - 2.0) < 3.0 + (hz - p.y) * 0.08 && ripples(p, hz, t * 2.0, 0.45, 12) > 0.0) c = ink(K3, 0.16);
  return c;
}
