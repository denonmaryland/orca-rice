// White: a snowfield. Grey peaks with white caps, a few small pines, snow falling.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.2);
  vec3 c = BG;
  float far = ridge(p.x, hz, R.y * 0.2, 0.011, 111);
  if (p.y < far) c = p.y > hz + R.y * 0.11 + 3.0 * vn(p.x * 0.5, 4) ? BG : ink(FG, 0.05);
  if (p.y < far && abs(p.y - floor(far)) < 0.5) c = ink(FG, 0.07);
  float near = ridge(p.x, hz - 3.0, R.y * 0.08, 0.02, 112);
  if (p.y < near) c = p.y > near - 3.0 - 2.0 * vn(p.x * 0.6, 5) ? ink(FG, 0.04) : ink(FG, 0.08);
  if (p.y < hz - 4.0) c = BG;
  if (p.y == hz - 4.0) c = ink(FG, 0.06);
  if (p.y < hz - 4.0 && pines(p, hz - 10.0, 18.0, 6.0, 12.0, 113) && h1(int(floor(p.x / 18.0)) + 5) < 0.4) c = ink(FG, 0.12);
  c = over(c, FG, snow(p, t, 9.0, 3.0, 0.3, 10) * 0.16);
  return c;
}
