/*
 Fragment shader implementing layered 2D fbm using a noise texture.
 Not a full volumetric renderer, but gives convincing depthy cloud look using multiple semi-3D planes.
*/
precision highp float;

uniform float uTime;
uniform sampler2D uNoise;
uniform float uCoverage;
uniform float uDensity;
uniform vec3 uLightDir;
uniform vec2 uOffset;

varying vec2 vUv;
varying vec3 vWorldPos;

// FBM using tiled noise texture (cheap)
float noise2d(vec2 p) {
  return texture2D(uNoise, p).r;
}

float fbm(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 5; i++) {
    f += amp * noise2d(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return f;
}

void main() {
  // world scaled uv to create variety
  vec2 uv = vUv * 4.0 + uOffset + vec2(uTime * 0.02);

  // base cloud shape
  float shape = fbm(uv * 0.6);
  float small = fbm(uv * 3.0) * 0.5;
  float density = smoothstep(uCoverage, uCoverage + 0.3, shape + small * 0.5);

  // add vertical falloff to make planes thicker in center
  float heightFactor = 1.0 - abs((vWorldPos.y - 28.0) / 40.0);
  heightFactor = clamp(heightFactor, 0.0, 1.0);

  float alpha = density * uDensity * heightFactor;
  alpha = clamp(alpha, 0.0, 1.0);

  // lighting (fake) to add shading across cloud
  float light = dot(normalize(uLightDir), normalize(vec3(0.0, 1.0, 0.0))) * 0.5 + 0.5;
  vec3 baseColor = mix(vec3(0.8,0.82,0.86), vec3(1.0), light);

  // soften edges
  alpha *= smoothstep(0.05, 0.0, length(vUv - 0.5));

  gl_FragColor = vec4(baseColor, alpha);
  if (gl_FragColor.a < 0.01) discard;
}
