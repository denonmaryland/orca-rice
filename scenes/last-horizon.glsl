// Last Horizon: planetrise. A banded giant fills the bottom of the sky, its atmosphere glowing at the limb;
// a satellite blinks across, and a meteor now and then.

vec3 scene(vec2 p, vec2 R, float t) {
  vec3 c = BG;
  c = over(c, U_HI, stars(p, 0.003, t, 16) * 0.3);
  c = over(c, U_HI, meteor(p, R, t, 21.0, 9) * 0.45);

  float pr = R.x * 0.95;
  vec2 pc = vec2(R.x * 0.42, R.y * 0.24 - pr);
  float d = length(p - pc);
  if (d < pr) {
    float lat = (p.y - pc.y) / pr;
    float band = vn(lat * 60.0 + 3.0 * fbm(p.x * 0.01 + t * 0.004, 62), 61);
    vec3 col = mix(K4, K3, dq(band, 3.0, p));
    float shade = smoothstep(-0.5, 0.7, (p.x - pc.x) / pr);
    c = ink(col, 0.08 + 0.14 * shade);
    if (pr - d < 2.0) c = ink(K5, 0.32 * (0.4 + 0.6 * shade));
  } else if (d < pr + 14.0) {
    c = over(c, K5, dq(0.16 * (1.0 - (d - pr) / 14.0), 6.0 / 0.16, p));
  }

  // a satellite
  float sx = mod(t * 3.0, R.x + 60.0) - 30.0;
  vec2 s = floor(vec2(sx, R.y * 0.7 + sx * 0.06));
  if (p == s) c = ink(U_HI, 0.35);
  if (p == s + vec2(1.0, 0.0) && fract(t / 1.6) < 0.15) c = ink(K1, 0.6);
  return c;
}
