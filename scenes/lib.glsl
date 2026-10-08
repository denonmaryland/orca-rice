// Shared by every scene: hashing, noise, ordered dithering and a few shapes, all on the art-pixel grid.
// A scene is `vec3 scene(vec2 p, vec2 R, float t)`: p the art pixel (whole numbers, bottom-left origin),
// R the grid's size in art pixels, t seconds (stepped). It returns the colour of that pixel, BG where empty.

vec3 BG;

uint hashu(uint x) {
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

float h1(int x) {
  return float(hashu(uint(x) * 747796405u + 2891336453u)) * (1.0 / 4294967296.0);
}

float h2(ivec2 q) {
  return float(hashu(uint(q.x) * 1597334677u ^ hashu(uint(q.y) + 3812015801u))) * (1.0 / 4294967296.0);
}

float h2(vec2 q) {
  return h2(ivec2(floor(q)));
}

// Value noise in 1D and 2D, smooth between whole numbers
float vn(float x, int seed) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(h1(int(i) + seed * 7919), h1(int(i) + 1 + seed * 7919), f);
}

float vn2(vec2 q, int seed) {
  vec2 i = floor(q);
  vec2 f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  ivec2 s = ivec2(seed * 101, seed * 37);
  float a = h2(ivec2(i) + s);
  float b = h2(ivec2(i) + s + ivec2(1, 0));
  float c = h2(ivec2(i) + s + ivec2(0, 1));
  float d = h2(ivec2(i) + s + ivec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(float x, int seed) {
  return 0.5 * vn(x, seed) + 0.3 * vn(x * 2.1, seed + 1) + 0.2 * vn(x * 4.3, seed + 2);
}

float fbm2(vec2 q, int seed) {
  return 0.5 * vn2(q, seed) + 0.3 * vn2(q * 2.03, seed + 1) + 0.2 * vn2(q * 4.01, seed + 2);
}

// Ordered dithering: a 4×4 Bayer threshold, and a value quantized to n levels through it
float bayer(vec2 p) {
  int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
  const float B[16] = float[](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return (B[i] + 0.5) / 16.0;
}

float dq(float v, float n, vec2 p) {
  return clamp(floor(v * n + bayer(p)) / n, 0.0, 1.0);
}

// A colour laid over the background at some strength
vec3 ink(vec3 c, float a) {
  return mix(BG, c, clamp(a, 0.0, 1.0));
}

vec3 over(vec3 base, vec3 c, float a) {
  return mix(base, c, clamp(a, 0.0, 1.0));
}

// Sky: from BG at the top to `glow` at the horizon, in dithered bands
vec3 sky(vec2 p, float hz, float top, vec3 glow, float a) {
  float u = clamp(1.0 - (p.y - hz) / max(top - hz, 1.0), 0.0, 1.0);
  return ink(glow, dq(u * u * a, 6.0 / max(a, 0.01), p) );
}

// Stars: single pixels that twinkle, and rarer four-point ones. 0 where there is none
float twinkle(float k, float t) {
  return 0.55 + 0.45 * sin(t * (0.5 + 2.0 * fract(k * 7.13)) + fract(k * 13.7) * 6.283);
}

float stars(vec2 p, float density, float t, int seed) {
  float h = h2(ivec2(p) + ivec2(seed * 131, seed * 71));
  float s = 0.0;
  if (h < density) {
    float k = h / density;
    s = (0.35 + 0.65 * fract(k * 3.1)) * twinkle(k, t);
  }
  // four-point stars, one possible per 13×13 cell
  vec2 cell = floor(p / 13.0);
  float hc = h2(ivec2(cell) + ivec2(seed * 17, 991));
  if (hc < density * 18.0) {
    vec2 c = cell * 13.0 + vec2(2.0) + floor(vec2(h2(ivec2(cell) + 7), h2(ivec2(cell) + 13)) * 9.0);
    vec2 d = abs(p - c);
    float k = hc / (density * 18.0);
    float tw = twinkle(k + 0.37, t);
    if (d.x + d.y < 0.5) s = max(s, tw);
    else if (d.x + d.y < 1.5 && min(d.x, d.y) < 0.5) s = max(s, 0.45 * tw * tw);
  }
  return s;
}

// A shooting star now and then: a short streak with a fading tail. `every` seconds apart on average
float meteor(vec2 p, vec2 R, float t, float every, int seed) {
  float n = floor(t / every);
  float k = t / every - n;
  if (h1(int(n) + seed) > 0.6 || k > 0.12) return 0.0;
  float u = k / 0.12;
  vec2 a = vec2(h1(int(n) * 3 + seed) * R.x * 0.8 + R.x * 0.1, R.y * (0.62 + 0.3 * h1(int(n) * 5 + seed)));
  vec2 dir = normalize(vec2(-1.0, -0.42));
  vec2 head = a + dir * u * R.x * 0.22;
  vec2 d = p - head;
  float along = -dot(d, dir);
  float across = abs(d.x * dir.y - d.y * dir.x);
  if (along < 0.0 || along > 14.0 || across > 0.6) return 0.0;
  return (1.0 - along / 14.0) * (1.0 - u * 0.6);
}

// Inside a circle (art pixels)
bool disc(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  return dot(d, d) <= r * r;
}

// A ridge line's height at column x: base + amp × noise
float ridge(float x, float base, float amp, float freq, int seed) {
  return base + amp * fbm(x * freq, seed);
}

// A perspective grid on the ground below the horizon, its rows sliding toward you at `speed`. 1 on a line
float gridFloor(vec2 p, vec2 R, float hz, float t, float speed) {
  float d = hz - p.y;
  if (d < 1.0) return 0.0;
  float z = 26.0 / d;
  float dz = 26.0 / (d * d);
  bool row = fract(z - t * speed) < dz;
  float x = (p.x - R.x * 0.5) / d * (hz / 20.0);
  bool col = abs(fract(x + 0.5) - 0.5) < 0.5 * hz / (20.0 * d);
  return (row || col) ? smoothstep(7.0, 18.0, d) : 0.0;
}

// Pine trees standing on `ground`, about `gap` apart: true inside one
bool pines(vec2 p, float ground, float gap, float hmin, float hmax, int seed) {
  float cell = floor(p.x / gap);
  for (int k = -1; k <= 1; k++) {
    float c = cell + float(k);
    float cx = c * gap + floor(h1(int(c) + seed) * gap * 0.6);
    float h = floor(mix(hmin, hmax, h1(int(c) * 3 + seed)));
    float y = p.y - ground;
    if (y < 0.0 || y > h) continue;
    float dx = abs(p.x - cx);
    if (y < h * 0.12) {
      if (dx < 1.0) return true;
      continue;
    }
    float u = (y - h * 0.12) / (h * 0.88);
    float tier = fract(u * 3.0);
    float w = (1.0 - u) * h * 0.32 * (0.62 + 0.38 * (1.0 - tier));
    if (dx <= max(w, 0.5)) return true;
  }
  return false;
}

// A pixel cloud: flat underside, bumpy top. c is the middle of its underside
bool cloud(vec2 p, vec2 c, float w, float h, int seed) {
  float dx = (p.x - c.x) / w;
  if (abs(dx) >= 1.0 || p.y < c.y) return false;
  float top = h * sqrt(1.0 - dx * dx) * (0.5 + 0.5 * vn(p.x * 0.16, seed));
  return p.y - c.y <= floor(top);
}

// Rain: streaks falling `speed` art pixels a second, leaning by `slant`; `density` of the columns carry a drop
float rain(vec2 p, vec2 R, float t, float density, float speed, float slant, float len, int seed) {
  float col = p.x + floor(p.y * slant);
  float h = h1(int(col) + seed * 1013);
  if (h > density) return 0.0;
  float k = h / density;
  float period = R.y + 40.0;
  float head = mod(-t * speed * (0.7 + 0.6 * fract(k * 5.3)) + fract(k * 9.1) * period, period) - 20.0;
  float d = p.y - floor(head);
  return (d >= 0.0 && d < len) ? 1.0 - d / len : 0.0;
}

// Snow (or anything that drifts): at most one flake a cell, falling `speed` a second (negative rises), swaying
float snow(vec2 p, float t, float cell, float speed, float chance, int seed) {
  vec2 q = vec2(p.x, p.y + floor(t * speed));
  vec2 ci = floor(q / cell);
  float h = h2(ivec2(ci) + ivec2(seed * 7, seed * 3));
  if (h > chance) return 0.0;
  vec2 f = ci * cell + 1.0 + floor(vec2(h2(ivec2(ci) + 11), h2(ivec2(ci) + 19)) * (cell - 2.0));
  f.x += floor(1.2 * sin(t * 0.7 + h * 40.0) + 0.5);
  vec2 d = abs(q - f);
  if (d.x < 0.5 && d.y < 0.5) return 0.6 + 0.4 * fract(h * 17.0);
  if (h < chance * 0.2 && d.x + d.y < 1.5) return 0.35;
  return 0.0;
}

// Lights wandering a box (fireflies, wisps), each glowing a while and resting a while; a soft one-pixel halo
float fireflies(vec2 p, vec2 lo, vec2 hi, float t, int n, int seed) {
  float s = 0.0;
  for (int i = 0; i < 24; i++) {
    if (i >= n) break;
    float fi = float(i);
    vec2 pos = floor(lo + (hi - lo) * vec2(vn(t * 0.05 + fi * 3.7, seed + i), vn(t * 0.06 + fi * 5.3, seed + 40 + i)));
    float glow = smoothstep(0.3, 0.85, 0.5 + 0.5 * sin(t * (0.5 + 0.4 * h1(i + seed)) + fi * 2.1));
    vec2 d = abs(p - pos);
    if (d.x + d.y < 0.5) s = max(s, glow);
    else if (d.x + d.y < 1.5) s = max(s, glow * 0.3);
  }
  return s;
}

// A bird: a five-pixel stroke, wings up then down
bool bird(vec2 p, vec2 b, float t, float phase) {
  vec2 d = p - floor(b);
  if (abs(d.x) > 2.0 || abs(d.y) > 1.0) return false;
  float wing = fract(t * 1.3 + phase) < 0.5 ? 1.0 : -1.0;
  if (abs(d.x) <= 1.0) return d.y == 0.0;
  return d.y == wing;
}

// Water below the horizon: short glints on its rows, drifting either way. 1 on a glint
float ripples(vec2 p, float hz, float t, float chance, int seed) {
  float d = hz - p.y;
  if (d < 1.0) return 0.0;
  float len = 3.0 + floor(d * 0.2);
  float dir = mod(p.y, 2.0) == 0.0 ? 1.0 : -1.0;
  float x = p.x + floor(t * (0.6 + 0.6 * h1(int(p.y) + seed)) * dir);
  float k = h2(ivec2(int(floor(x / len)), int(p.y) + seed * 31));
  return k < chance ? 1.0 : 0.0;
}

// A 3×5 digit; true on its pixels. q is the pixel inside the glyph, from its bottom left
bool digit(int n, vec2 q) {
  if (q.x < 0.0 || q.y < 0.0 || q.x > 2.0 || q.y > 4.0) return false;
  const int D[10] = int[](31599, 11415, 29671, 29391, 23497, 31183, 31215, 29330, 31727, 31695);
  int bit = 14 - ((4 - int(q.y)) * 3 + int(q.x));
  return ((D[n] >> bit) & 1) == 1;
}

