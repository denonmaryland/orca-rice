// Everforest: a pine forest at night in three rows, mist drifting between them, fireflies in front.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.1);
  vec3 c = sky(p, hz, R.y, K6, 0.08);
  c = over(c, U_HI, stars(p, 0.0025, t, 5) * 0.2);

  // far hills of pines
  float g1 = hz + floor(R.y * 0.1 + 4.0 * fbm(p.x * 0.02, 11));
  if (p.y < g1 || pines(p, g1, 6.0, R.y * 0.05, R.y * 0.12, 11)) c = ink(K6, 0.1);

  // mist in front of them
  float m = smoothstep(0.45, 0.8, fbm2(vec2(p.x * 0.03 + t * 0.2, p.y * 0.12), 12));
  float band = exp(-pow((p.y - g1 + 2.0) / 5.0, 2.0));
  c = over(c, U_LAVENDER, dq(0.1 * m * band, 6.0 / 0.1, p));

  // middle and near rows, darker than the night
  float g2 = hz + floor(R.y * 0.04);
  if (p.y < g2 || pines(p, g2, 9.0, R.y * 0.08, R.y * 0.17, 13)) c = mix(BG, vec3(0.0), 0.16);
  if (p.y < hz || pines(p, hz, 14.0, R.y * 0.1, R.y * 0.24, 15)) c = mix(BG, vec3(0.0), 0.3);

  // fireflies
  float ff = fireflies(p, vec2(0.0, 2.0), vec2(R.x, R.y * 0.32), t, 16, 3);
  c = over(c, K3, ff * 0.6);
  return c;
}
