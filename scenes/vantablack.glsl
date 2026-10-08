// Vantablack: the void. Very few stars, a far spiral galaxy turning too slowly to see, a rare meteor.

vec3 scene(vec2 p, vec2 R, float t) {
  vec3 c = BG;
  c = over(c, FG, stars(p, 0.0016, t, 18) * 0.36);
  c = over(c, FG, meteor(p, R, t, 19.0, 11) * 0.5);

  vec2 g = vec2(R.x * 0.24, R.y * 0.58);
  vec2 v = (p - g) * vec2(1.0, 2.2);
  float r = length(v);
  if (r < 40.0) {
    float a = atan(v.y, v.x);
    float arms = 0.5 + 0.5 * sin(a * 2.0 - log(r + 1.0) * 4.5 + t * 0.03);
    float b = exp(-r / 11.0) * (0.35 + 0.65 * arms);
    c = over(c, U_LAVENDER, dq(0.16 * b, 6.0 / 0.16, p));
    if (r < 1.5) c = ink(U_LAVENDER, 0.3);
  }
  return c;
}
