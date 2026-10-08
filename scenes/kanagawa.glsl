// Kanagawa: the great wave. A crest curls over the sea with foam at its lip; Fuji small on the horizon.

vec3 scene(vec2 p, vec2 R, float t) {
  float hz = floor(R.y * 0.2);
  vec3 c = sky(p, hz, R.y, U_LAVENDER, 0.07);
  c = over(c, U_LAVENDER, stars(p, 0.0018, t, 9) * 0.2);

  // Fuji: a cone with a flat summit and a ragged snow cap
  vec2 f = vec2(floor(R.x * 0.46), hz);
  float fh = floor(R.y * 0.15);
  float top = min(fh - abs(p.x - f.x) * 0.62, fh - 1.0);
  if (p.y >= hz && p.y - hz <= top) {
    c = ink(K4, 0.13);
    if (p.y - hz > fh * 0.72 - 2.0 * h1(int(p.x))) c = ink(U_HI, 0.24);
  }

  // the sea, rows of glints drifting
  if (p.y < hz) {
    c = ink(K4, 0.07);
    if (ripples(p, hz, t, 0.1, 5) > 0.0) c = ink(U_HI, 0.13);
  }

  // the wave: a hook risen from the sea, thick at its back, its lip curling over to the right with foam
  // claws hanging into the hollow; it breathes a little
  float wr = floor(clamp(R.y * 0.18, 16.0, 40.0));
  vec2 wc = vec2(floor(R.x * 0.15), hz + floor(wr * 0.35) + floor(sin(t * 0.5) * 1.2 + 0.5));
  vec2 ic = wc + vec2(wr * 0.45, -wr * 0.25);
  float ir = wr * 0.8;
  float d1 = length(p - wc);
  float d2 = length(p - ic);
  float ang = atan(p.y - ic.y, p.x - ic.x);
  float claw = h2(vec2(floor(ang * 16.0), 3.0));
  bool upper = p.y > ic.y + wr * 0.05;
  if (d1 <= wr && p.y >= hz - 3.0) {
    if (d2 > ir) {
      c = ink(K4, 0.2);
      if (fract(d1 / 6.0) < 0.17) c = ink(K4, 0.27);
      if (upper && d2 - ir < 2.0) c = ink(U_HI, 0.3);
    } else if (upper && ir - d2 < 1.0 + 4.0 * claw * step(0.45, claw) && mod(floor(ang * 16.0), 2.0) == 0.0) {
      c = ink(U_HI, 0.26);
    }
  }
  // spray off the lip
  vec2 lipAt = floor(wc + vec2(wr * 0.55, wr * 0.82));
  if (abs(p.x - lipAt.x) < 14.0 && p.y > lipAt.y - 4.0 && p.y < lipAt.y + 9.0) c = over(c, U_HI, snow(p - lipAt, -t, 5.0, 3.0, 0.3, 6) * 0.22);

  // a second, smaller swell on the right
  float sw = hz - 1.0 + floor(4.0 * exp(-pow((p.x - R.x * 0.8) / 18.0, 2.0)) + sin(p.x * 0.3 + t) * 0.8);
  if (p.y < hz + 4.0 && p.y >= hz - 2.0 && p.y <= sw) c = ink(K4, 0.16);
  return c;
}
