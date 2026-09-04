export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uGlassCenter;
uniform vec2 uGlassSize;
uniform float uRadius;
uniform float uBezel;
uniform float uThickness;
uniform float uIOR;
uniform float uBlur;
uniform float uSpecular;
uniform vec3 uTint;
uniform float uTintAlpha;
uniform float uShadow;
uniform float uDispersion;
uniform vec2 uLightDir;
uniform sampler2D uBgTex;
uniform float uBgAspect;
uniform bool uHasBgTex;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = clamp(1.0 - t, 0.0, 1.0);
  return pow(1.0 - s * s * s * s, 0.25);
}

vec3 sampleBg(vec2 screenUV) {
  if (!uHasBgTex) {
    // Elegant procedural gradient background fallback
    vec2 p = screenUV * 2.0 - 1.0;
    vec3 c1 = vec3(0.08, 0.09, 0.14);
    vec3 c2 = vec3(0.18, 0.12, 0.28);
    vec3 c3 = vec3(0.05, 0.22, 0.35);
    return mix(mix(c1, c2, screenUV.x), c3, screenUV.y);
  }

  float screenAspect = uResolution.x / uResolution.y;
  vec2 uv = screenUV;
  if (uBgAspect > screenAspect) {
    float s = screenAspect / uBgAspect;
    uv.x = uv.x * s + (1.0 - s) * 0.5;
  } else {
    float s = uBgAspect / screenAspect;
    uv.y = uv.y * s + (1.0 - s) * 0.5;
  }
  uv.y = 1.0 - uv.y;
  return texture2D(uBgTex, uv).rgb;
}

// 16-sample Poisson disk blur for realistic bokeh
vec3 sampleBgBlurred(vec2 uv, float radius) {
  if (radius < 0.2) return sampleBg(uv);
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;

  vec2 offsets[16];
  offsets[0]  = vec2(-0.94201, -0.39906);
  offsets[1]  = vec2( 0.94558, -0.76890);
  offsets[2]  = vec2(-0.09418, -0.92938);
  offsets[3]  = vec2( 0.34495,  0.29387);
  offsets[4]  = vec2(-0.91588, -0.45771);
  offsets[5]  = vec2(-0.81544,  0.48568);
  offsets[6]  = vec2(-0.38277, -0.56071);
  offsets[7]  = vec2(-0.12675,  0.84686);
  offsets[8]  = vec2( 0.89642,  0.41254);
  offsets[9]  = vec2( 0.18150, -0.30020);
  offsets[10] = vec2(-0.01445, -0.16001);
  offsets[11] = vec2( 0.59614,  0.71118);
  offsets[12] = vec2( 0.49742, -0.47280);
  offsets[13] = vec2( 0.80685,  0.04588);
  offsets[14] = vec2(-0.32490, -0.03965);
  offsets[15] = vec2(-0.60975,  0.06566);

  for (int i = 0; i < 16; i++) {
    sum += sampleBg(uv + offsets[i] * radius * px);
  }
  return sum / 16.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 p = screenPx - uGlassCenter;
  vec2 halfSize = uGlassSize * 0.5;

  float sd = sdRoundedRect(p, halfSize, uRadius);

  // Outside glass: Outer soft drop shadow
  if (sd > 0.0) {
    float shadowFalloff = exp(-sd * sd / 850.0);
    float shadowAlpha = uShadow * shadowFalloff * 0.55;
    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(uBezel, min(uRadius, min(halfSize.x, halfSize.y)) - 1.0);
  bezel = max(bezel, 1.0);
  float t = clamp(distFromEdge / bezel, 0.0, 1.0);

  // Surface height profile and derivative (slope)
  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;

  // Snell's Law refraction ray displacement
  float slopeAngle = atan(dh * (uThickness / bezel));
  float sinR = clamp(sin(slopeAngle) / max(uIOR, 1.001), -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * uThickness * (tan(slopeAngle) - tan(thetaR));

  // Surface normal gradient from distance field
  vec2 grad;
  float eps = 0.5;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, uRadius) - sd;
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, uRadius) - sd;
  grad = normalize(grad);

  vec2 baseOffset = -grad * displacement / uResolution;
  vec2 screenUV = screenPx / uResolution;

  // Chromatic Aberration (Dispersion) along refracted vector (delicate, natural optical prism)
  vec3 color;
  if (uDispersion > 0.001) {
    vec2 offsetR = baseOffset * (1.0 + uDispersion * 2.0);
    vec2 offsetG = baseOffset;
    vec2 offsetB = baseOffset * (1.0 - uDispersion * 2.0);
    color.r = sampleBgBlurred(screenUV + offsetR, uBlur).r;
    color.g = sampleBgBlurred(screenUV + offsetG, uBlur).g;
    color.b = sampleBgBlurred(screenUV + offsetB, uBlur).b;
  } else {
    color = sampleBgBlurred(screenUV + baseOffset, uBlur);
  }

  // Specular rim reflection
  vec2 lDir = normalize(uLightDir);
  float rimDot = abs(dot(grad, lDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.45, distFromEdge);
  float specHighlight = pow(rimDot * rimFalloff, 1.8);
  color += vec3(specHighlight * uSpecular);

  // Grazing angle Fresnel term (higher reflection on curved rim)
  float fresnel = pow(clamp(1.0 - distFromEdge / bezel, 0.0, 1.0), 3.0) * 0.28 * uSpecular;
  color += vec3(fresnel);

  // Inner shadow vignette along bezel transition
  float innerShadow = 1.0 - smoothstep(0.0, bezel * 0.6, distFromEdge);
  color *= mix(1.0, 0.76, innerShadow * 0.3);

  // Subtle inner rim crystal glow
  float innerRim = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 5.0, distFromEdge));
  color += vec3(innerRim * 0.2 * uSpecular);

  // Tint overlay
  color = mix(color, uTint, uTintAlpha);

  // Micro-frost surface dither to eliminate banding and add organic luxury tactile texture
  float dither = fract(sin(dot(screenPx, vec2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) * 0.006;

  // Smooth anti-aliased edge alpha
  float alpha = smoothstep(0.0, 1.5, distFromEdge);
  gl_FragColor = vec4(color, alpha);
}
`;
