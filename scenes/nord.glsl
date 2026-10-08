// Nord: aurora over a fjord. Curtains of light ripple above snowy peaks; snow falls on the still water.

float aurora(vec2 p, vec2 R, float t) {
  float base = R.y * 0.48 + R.y * 0.12 * (fbm(p.x * 0.005 + t * 0.015, 3) - 0.5) * 2.0;
  float y = p.y - base;
  if (y < 0.0 || y > R.y * 0.3) return 0.0;
  float rays = 0.6 * vn(p.x * 0.3 + t * 0.5, 8) + 0.4 * vn(p.x * 0.07 - t * 0.15, 9);
  float fade = exp(-y / (R.y * 0.08));
  float curtains = smoothstep(0.3, 0.85, vn(p.x * 0.01 + t * 0.025, 12));
  return rays * fade * smoothstep(0.0, 3.0, y) * curtains;
}

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.16);
  vec3 c = sky(p, hz, R.y, K4, 0.07);
  c = over(c, U_HI, stars(p, 0.003, t, 6) * 0.24);

  // the aurora, green at its foot to blue and violet above
  float a = aurora(p, R, t);
  if (a > 0.0) {
    float hgt = clamp((p.y - R.y * 0.45) / (R.y * 0.25), 0.0, 1.0);
    vec3 col = mix(K2, K6, smoothstep(0.0, 0.5, hgt));
    col = mix(col, K5, smoothstep(0.5, 1.0, hgt));
    c = over(c, col, dq(a * 0.34, 30.0, p));
  }

  // far peaks with snow, then the dark near shore
  float far = ridge(p.x, hz, R.y * 0.2, 0.012, 21);
  if (p.y < far) {
    c = ink(K4, 0.13);
    if (p.y > hz + R.y * 0.11 + 3.0 * vn(p.x * 0.4, 2)) c = ink(U_HI, 0.2);
  }
  float near = ridge(p.x, hz - 2.0, R.y * 0.1, 0.02, 22) - R.y * 0.04;
  if (p.y < near) c = mix(BG, vec3(0.0), 0.22);

  // the fjord: still water, faint glints
  if (p.y < hz && p.y >= near) {
    c = ink(K4, 0.05);
    if (ripples(p, hz, t, 0.08, 4) > 0.0) c = ink(K2, 0.1);
  }

  c = over(c, U_HI, snow(p, t, 10.0, 3.5, 0.3, 3) * 0.24);
  return c;
}
