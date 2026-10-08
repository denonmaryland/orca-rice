// The scene goes only where the terminal shows its own background: text, and anything drawn on a colour of
// its own (selections, your messages, the status line), stays as it is. Scenes move at 10 frames a second, or
// stand at STILL_T (orca-rice scene still).
// Ghostty's fragCoord starts at the top left (as its texture does); scenes are drawn from the bottom up.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec4 term = texture(iChannel0, uv);
  BG = iBackgroundColor;
  float px = clamp(floor(iResolution.y / 170.0), 3.0, 7.0);
  vec2 R = floor(iResolution.xy / px);
  vec2 up = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 p = floor(up / px);
  float t = STILL_T >= 0.0 ? STILL_T : floor(iTime * 10.0) / 10.0;
  vec3 s = scene(p, R, t);
  s = mix(BG, s, STRENGTH);
  float d = length(term.rgb - BG);
  float keep = smoothstep(0.01, 0.06, d);
  fragColor = vec4(mix(s, term.rgb, keep), term.a);
}
