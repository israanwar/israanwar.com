import { useEffect, useRef, useState } from "react";
import "./HeroPointCloud.css";

// A lean, robot-free rendering of "The Sun" formation from
// OkkaRobotPointCloud.jsx — the humanoid there is currently invisible
// (robotGroup.visible = false), so this reuses the exact same shaders,
// geometry and animation math for the stellar body/glow/dust/icons and
// produces pixel-identical output, without paying for the ~2MB GLB fetch,
// mesh sampling, or arm/head rig that never render anything on screen.
// Used to give every public page's hero the same live background as Home.
//
// The WebGL scene itself (renderer/canvas/geometries/shaders/animation
// loop) is a module-level singleton, built once and then re-parented
// between pages on navigation instead of being torn down and rebuilt from
// scratch every time — recreating it per page was the actual cause of the
// slow feel when navigating between pages (shader compilation and
// composer/bloom render-target setup on every mount). See ensureShared()/
// attachShared()/detachShared() below.
const FALLBACK_SRC = "/assets/3d/okka-fallback.jpg";
const MOBILE_BREAKPOINT = 767;
const DESKTOP_SWARM_POINT_COUNT = 24000;
const MOBILE_SWARM_POINT_COUNT = 7000;
const DESKTOP_DUST_COUNT = 420;
const MOBILE_DUST_COUNT = 140;

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const DUST_VERTEX_SHADER = `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMotion;
  varying float vAlpha;

  void main() {
    vec3 transformed = position;
    transformed.x += sin(uTime * 0.13 + aSeed * 9.0) * 0.04 * uMotion;
    transformed.y += cos(uTime * 0.11 + aSeed * 7.0) * 0.035 * uMotion;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_PointSize = aSize * uPixelRatio * (7.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = 0.18 + fract(aSeed * 17.0) * 0.28;
  }
`;

const DUST_FRAGMENT_SHADER = `
  precision mediump float;
  varying float vAlpha;
  void main() {
    float alpha = smoothstep(0.5, 0.04, length(gl_PointCoord - 0.5));
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(0.62, 0.56, 0.82, alpha * vAlpha * 0.7);
  }
`;

// A lavender interpretation of the community "The Sun" formation from
// particles.casberry.in: a dense stellar body, turbulent photosphere,
// chromospheric spicules, magnetic corona loops, and escaping solar wind.
const SWARM_VERTEX_SHADER = `
  attribute vec4 aSunSeed;
  attribute float aLayer;
  attribute float aLoop;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMotion;
  uniform float uLayerPass;
  uniform vec3 uImpactCenter;
  uniform float uImpactStrength;
  uniform float uImpactPhase;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorLight;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float t = uTime * uMotion * 2.4;
    float tau = 6.2831853;
    float theta = aSunSeed.x * tau + t * 0.018;
    float cosPhi = aSunSeed.y * 2.0 - 1.0;
    float sinPhi = sqrt(max(0.0, 1.0 - cosPhi * cosPhi));
    vec3 sphereDir = vec3(sinPhi * cos(theta), sinPhi * sin(theta), cosPhi);
    vec3 transformed;
    float brightness;
    float opacity;

    if (aLayer < 0.68) {
      float shell = smoothstep(0.0, 1.0, aLayer / 0.68);
      float radius = mix(2.45, 4.35, pow(shell, 0.2));
      float cells = sin(theta * 9.0 + t * 0.34)
        + sin(cosPhi * 21.0 - t * 0.29 + aSunSeed.z * tau)
        + sin(theta * 13.0 + cosPhi * 11.0 + t * 0.22);
      radius += cells * mix(0.055, 0.135, shell);
      radius += sin(t * 0.72 + aSunSeed.w * tau) * 0.035;
      transformed = sphereDir * radius;
      brightness = mix(0.54, 1.0, shell) + cells * 0.045;
      opacity = mix(0.18, 0.52, shell);
    } else if (aLayer < 0.80) {
      float spike = abs(sin(t * 1.35 + aSunSeed.z * 18.85));
      float radius = 4.38 + spike * (0.28 + aSunSeed.w * 0.4);
      transformed = sphereDir * radius;
      brightness = 0.68 + spike * 0.32;
      opacity = 0.24 + spike * 0.22;
    } else if (aLayer < 0.94) {
      float loopSeedA = fract(abs(sin((aLoop + 1.0) * 17.17) * 6543.21));
      float loopSeedB = fract(abs(sin((aLoop + 1.0) * 29.71) * 7654.32));
      float loopSeedC = fract(abs(sin((aLoop + 1.0) * 53.13) * 8765.43));
      float anchorTheta = loopSeedA * tau;
      float anchorCosPhi = loopSeedB * 2.0 - 1.0;
      float anchorSinPhi = sqrt(max(0.0, 1.0 - anchorCosPhi * anchorCosPhi));
      vec3 anchor = vec3(anchorSinPhi * cos(anchorTheta), anchorSinPhi * sin(anchorTheta), anchorCosPhi);
      vec3 reference = abs(anchor.y) < 0.88 ? vec3(0.0, 1.0, 0.12) : vec3(1.0, 0.0, 0.12);
      vec3 tangent = normalize(cross(reference, anchor));
      vec3 bitangent = normalize(cross(anchor, tangent));
      float along = aSunSeed.z;
      float width = 0.24 + loopSeedC * 0.48;
      float angle = (along - 0.5) * width * 2.0;
      vec3 loopDir = normalize(anchor + tangent * sin(angle) + bitangent * sin(angle * 0.72) * 0.18);
      float arch = sin(along * 3.1415926);
      float pulse = 0.72 + 0.28 * sin(t * 0.38 + loopSeedC * tau);
      transformed = loopDir * (4.16 + arch * (0.72 + loopSeedC * 1.22) * pulse);
      brightness = 0.58 + arch * 0.42;
      opacity = 0.12 + arch * 0.22;
    } else {
      float travel = fract(t * 0.055 + aSunSeed.z) * 7.0;
      transformed = sphereDir * (4.45 + travel);
      brightness = 0.28 + (1.0 - travel / 7.0) * 0.48;
      opacity = (1.0 - travel / 7.0) * 0.15;
    }

    float spin = t * 0.025;
    float spinSin = sin(spin);
    float spinCos = cos(spin);
    transformed.xy = mat2(spinCos, -spinSin, spinSin, spinCos) * transformed.xy;
    transformed *= 1.16;
    vec3 impactDelta = transformed - uImpactCenter;
    float impactDistance = length(impactDelta);
    float pressureRadius = uImpactPhase * 1.55;
    float contact = exp(-(impactDistance * impactDistance) / 0.16) * (1.0 - uImpactPhase);
    float pressureRing = exp(-pow((impactDistance - pressureRadius) / 0.22, 2.0));
    vec3 impactNormal = normalize(uImpactCenter);
    float impactEnergy = (contact * 0.42 + pressureRing * 0.16) * uImpactStrength;
    transformed += impactNormal * impactEnergy;
    brightness += (contact * 0.9 + pressureRing * 0.62) * uImpactStrength;
    opacity += (contact * 0.18 + pressureRing * 0.11) * uImpactStrength;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float frontDepth = mvPosition.z - mvCenter.z;
    float frontMask = smoothstep(0.12, 1.18, frontDepth);
    float layerMask = uLayerPass > 0.5 ? frontMask : (1.0 - frontMask);
    if (layerMask < 0.01) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vColor = vec3(0.0);
      vAlpha = 0.0;
      return;
    }
    float shimmer = 0.72 + 0.28 * sin(t * 0.58 + aSunSeed.w * tau);
    gl_PointSize = aSize * uPixelRatio * shimmer * (12.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    vColor = mix(uColorDeep, uColorMid, smoothstep(0.2, 0.72, brightness));
    vColor = mix(vColor, uColorLight, smoothstep(0.76, 1.0, brightness));
    float passOpacity = uLayerPass > 0.5 ? 0.32 : 1.0;
    vAlpha = opacity * shimmer * layerMask * passOpacity;
  }
`;

const SWARM_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.04, d);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

// A soft photosphere disc underneath the particle layers makes the stellar
// silhouette immediately legible as a sun.
const SUN_GLOW_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SUN_GLOW_FRAGMENT_SHADER = `
  precision mediump float;
  uniform float uTime;
  uniform float uMotion;
  varying vec2 vUv;

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float radius = length(centered);
    if (radius > 1.0) discard;
    float disc = 1.0 - smoothstep(0.72, 1.0, radius);
    float rim = smoothstep(0.58, 0.9, radius) * (1.0 - smoothstep(0.9, 1.0, radius));
    float pulse = 0.92 + sin(uTime * 0.42 * uMotion) * 0.08;
    float grain = 0.94 + sin(centered.x * 18.0 + centered.y * 15.0 + uTime * 0.18 * uMotion) * 0.06;
    vec3 deep = vec3(0.18, 0.09, 0.29);
    vec3 lavender = vec3(0.61, 0.48, 0.91);
    vec3 color = mix(deep, lavender, (1.0 - radius) * 0.72 + rim * 0.28);
    float alpha = (disc * 0.2 + rim * 0.1) * pulse * grain;
    gl_FragColor = vec4(color, alpha);
  }
`;

// Small ambient particle-outline icons (diamond, ring, plus, triangle)
// drifting slowly in the background.
const ICON_VERTEX_SHADER = `
  attribute vec3 aLocal;
  attribute vec3 aCenter;
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMotion;
  varying float vAlpha;

  void main() {
    float ang = uTime * 0.1 * uMotion + aSeed * 3.0;
    float s = sin(ang);
    float c = cos(ang);
    vec3 rotated = vec3(aLocal.x * c - aLocal.y * s, aLocal.x * s + aLocal.y * c, aLocal.z);
    vec3 bob = vec3(
      sin(uTime * 0.22 + aSeed * 5.0) * 0.14,
      cos(uTime * 0.18 + aSeed * 4.0) * 0.11,
      0.0
    ) * uMotion;
    vec3 transformed = aCenter + rotated + bob;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_PointSize = aSize * uPixelRatio * (7.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = 0.3 + fract(aSeed * 13.0) * 0.22;
  }
`;

const ICON_FRAGMENT_SHADER = `
  precision mediump float;
  varying float vAlpha;
  void main() {
    float alpha = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(0.78, 0.72, 0.98, alpha * vAlpha * 0.8);
  }
`;

function makeDust(THREE, count) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const radius = 1.9 + Math.random() * 1.8;
    const theta = Math.random() * Math.PI * 2;
    positions[index * 3] = Math.cos(theta) * radius;
    positions[index * 3 + 1] = (Math.random() - 0.42) * 5.2;
    positions[index * 3 + 2] = Math.sin(theta) * radius * 0.52;
    sizes[index] = 0.9 + Math.random() * 1.35;
    seeds[index] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

function makeSwarmField(THREE, count) {
  const positions = new Float32Array(count * 3);
  const sunSeeds = new Float32Array(count * 4);
  const layers = new Float32Array(count);
  const loops = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const progress = (index + 0.5) / count;
    const seedA = Math.abs(Math.sin((index + 1) * 12.9898) * 43758.5453) % 1;
    const seedB = Math.abs(Math.sin((index + 1) * 78.233) * 12543.123) % 1;
    const seedC = Math.abs(Math.sin((index + 1) * 45.164) * 98765.432) % 1;
    const seedD = Math.abs(Math.sin((index + 1) * 33.719) * 54321.987) % 1;
    sunSeeds[index * 4] = seedA;
    sunSeeds[index * 4 + 1] = seedB;
    sunSeeds[index * 4 + 2] = seedC;
    sunSeeds[index * 4 + 3] = seedD;
    layers[index] = progress;
    loops[index] = index % 16;
    sizes[index] = 1.3 + seedD * 1.9;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSunSeed", new THREE.BufferAttribute(sunSeeds, 4));
  geometry.setAttribute("aLayer", new THREE.BufferAttribute(layers, 1));
  geometry.setAttribute("aLoop", new THREE.BufferAttribute(loops, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  return geometry;
}

function polygonOutline(corners, pointsPerEdge) {
  const pts = [];
  for (let i = 0; i < corners.length; i += 1) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    for (let t = 0; t < pointsPerEdge; t += 1) {
      const f = t / pointsPerEdge;
      pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
  }
  return pts;
}
function circleOutline(count) {
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  return pts;
}
const ICON_SHAPES = [
  polygonOutline([[0, 1], [0.62, 0], [0, -1], [-0.62, 0]], 9),
  circleOutline(30),
  polygonOutline(
    [[-0.16, 1], [0.16, 1], [0.16, 0.16], [1, 0.16], [1, -0.16], [0.16, -0.16],
      [0.16, -1], [-0.16, -1], [-0.16, -0.16], [-1, -0.16], [-1, 0.16], [-0.16, 0.16]],
    3,
  ),
  polygonOutline([[0, 1], [0.87, -0.5], [-0.87, -0.5]], 11),
];

function makeIconField(THREE, isMobile) {
  const instances = isMobile
    ? [{ shape: 0, cx: -2.3, cy: 1.15, cz: -1.1, scale: 0.32 },
      { shape: 2, cx: 2.15, cy: -0.75, cz: -0.9, scale: 0.28 }]
    : [{ shape: 0, cx: -3.4, cy: 1.5, cz: -1.4, scale: 0.42 },
      { shape: 1, cx: 3.5, cy: 0.65, cz: -1.1, scale: 0.36 },
      { shape: 2, cx: -3.0, cy: -1.6, cz: -0.8, scale: 0.3 },
      { shape: 3, cx: 3.1, cy: -2.0, cz: -1.3, scale: 0.34 }];
  const positions = [];
  const local = [];
  const centers = [];
  const seeds = [];
  const sizes = [];
  instances.forEach((inst, idx) => {
    ICON_SHAPES[inst.shape].forEach((p) => {
      positions.push(inst.cx, inst.cy, inst.cz);
      local.push(p[0] * inst.scale, p[1] * inst.scale, 0);
      centers.push(inst.cx, inst.cy, inst.cz);
      seeds.push(idx * 1.7 + 0.4);
      sizes.push(isMobile ? 2.0 : 1.7);
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("aLocal", new THREE.BufferAttribute(new Float32Array(local), 3));
  geometry.setAttribute("aCenter", new THREE.BufferAttribute(new Float32Array(centers), 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(seeds), 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(sizes), 1));
  return geometry;
}

// Both arms first rise into a braced, fists-up stance, then short
// alternating elbow extensions drive fists into the inner shell — this
// only ever drives the invisible impact-target transform (the punch
// itself isn't rendered), but the resulting pressure pulse on the sun's
// own surface is, so the cadence is kept identical to Home.
const POUND_CYCLE = 7.4;
const POUND_HITS = [
  { time: 1.8, side: 1 },
  { time: 2.5, side: -1 },
  { time: 3.18, side: 1 },
  { time: 3.84, side: -1 },
];

// ---------------------------------------------------------------------
// Module-level singleton: one WebGL scene, shaders and geometries per
// factory instance. Pages don't own the scene — they borrow it by re-
// parenting `shared.shellEl` (the canvas host) into their own wrapper on
// mount, and handing it back to a hidden "keep-alive" host on unmount, so
// navigating between pages is just a DOM move + a resize, not a rebuild.
// Instantiated twice below (createSharedSunFactory) — once for the
// per-page hero background, once for the mobile-menu overlay — since
// those two can be visible at the same time (menu open over a page) and
// a single canvas can't be in two places in the DOM at once.
function getKeepAliveHost() {
  let host = document.getElementById("okr-sun-keepalive");
  if (!host) {
    host = document.createElement("div");
    host.id = "okr-sun-keepalive";
    // Kept in the live document (not just detached in memory) so the
    // canvas/WebGL context stays exactly as valid as when it's visible —
    // just off-screen and inert between pages.
    host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(host);
  }
  return host;
}

function createSharedSunFactory() {
  let shared = null;
  let initPromise = null;
  return async function ensureShared() {
  if (shared) return shared;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const [THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import("three"),
      import("three/examples/jsm/postprocessing/EffectComposer.js"),
      import("three/examples/jsm/postprocessing/RenderPass.js"),
      import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
      import("three/examples/jsm/postprocessing/OutputPass.js"),
    ]);

    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dustCount = isMobile ? MOBILE_DUST_COUNT : DESKTOP_DUST_COUNT;
    // Same reference point Home derives from the (currently invisible)
    // robot's display height, kept so the scroll-zoom vertical shift
    // matches exactly: robotDisplayHeight * (1 - 0.59).
    const HEAD_ANCHOR_Y = (isMobile ? 4.25 : 4.5) * 0.41;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0713);
    const solarSystemGroup = new THREE.Group();
    solarSystemGroup.position.set(0, 0.45, 0);
    scene.add(solarSystemGroup);
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0, 12.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.5));
    renderer.setClearColor(0x0c0713, 1);

    const shellEl = document.createElement("div");
    shellEl.className = "okr__isra-cloud-stage";
    shellEl.setAttribute("aria-hidden", "true");
    shellEl.appendChild(renderer.domElement);

    const sunGlowGeometry = new THREE.PlaneGeometry(12.2, 12.2, 1, 1);
    const sunGlowMaterial = new THREE.ShaderMaterial({
      vertexShader: SUN_GLOW_VERTEX_SHADER,
      fragmentShader: SUN_GLOW_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uMotion: { value: reducedMotion ? 0 : 1 } },
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.set(0, 0.45, -5.45);
    sunGlow.renderOrder = -3;
    scene.add(sunGlow);

    const swarmGeometry = makeSwarmField(THREE, isMobile ? MOBILE_SWARM_POINT_COUNT : DESKTOP_SWARM_POINT_COUNT);
    const makeSwarmMaterial = (layerPass) => new THREE.ShaderMaterial({
      vertexShader: SWARM_VERTEX_SHADER,
      fragmentShader: SWARM_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uMotion: { value: reducedMotion ? 0 : 1 },
        uLayerPass: { value: layerPass },
        uImpactCenter: { value: new THREE.Vector3(0, 0.3, 5.0) },
        uImpactStrength: { value: 0 },
        uImpactPhase: { value: 0 },
        uColorDeep: { value: new THREE.Color(0x4b2f70) },
        uColorMid: { value: new THREE.Color(0x9c7be7) },
        uColorLight: { value: new THREE.Color(0xf0eaff) },
      },
    });
    const swarmBackMaterial = makeSwarmMaterial(0);
    const swarmFrontMaterial = makeSwarmMaterial(1);
    const swarmBack = new THREE.Points(swarmGeometry, swarmBackMaterial);
    const swarmFront = new THREE.Points(swarmGeometry, swarmFrontMaterial);
    swarmBack.frustumCulled = false;
    swarmFront.frustumCulled = false;
    swarmBack.renderOrder = -2;
    swarmFront.renderOrder = 3;
    solarSystemGroup.add(swarmBack);
    solarSystemGroup.add(swarmFront);

    const dustGeometry = makeDust(THREE, dustCount);
    const dustMaterial = new THREE.ShaderMaterial({
      vertexShader: DUST_VERTEX_SHADER,
      fragmentShader: DUST_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() }, uMotion: { value: reducedMotion ? 0 : 1 } },
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const iconGeometry = makeIconField(THREE, isMobile);
    const iconMaterial = new THREE.ShaderMaterial({
      vertexShader: ICON_VERTEX_SHADER,
      fragmentShader: ICON_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() }, uMotion: { value: reducedMotion ? 0 : 1 } },
    });
    const icons = new THREE.Points(iconGeometry, iconMaterial);
    icons.frustumCulled = false;
    scene.add(icons);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), isMobile ? 0.3 : 0.55, 0.6, 0.7);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    function resize() {
      const width = shellEl.clientWidth;
      const height = shellEl.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = width / height < 0.78 ? 13.6 : 12.4;
      camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(shellEl);

    const maxYaw = THREE.MathUtils.degToRad(14);
    const maxPitch = THREE.MathUtils.degToRad(5);
    const maxDragPitch = THREE.MathUtils.degToRad(45);
    let targetYaw = 0;
    let targetPitch = 0;
    let yaw = 0;
    let pitch = 0;
    let solarYaw = 0;
    let solarPitch = 0;
    let pointerActive = false;
    let lastPointer = -Infinity;
    let elapsed = 0;
    let lastFrame = performance.now();
    let frame = 0;
    let running = false;

    // Scroll-in zoom, matching Home: as the visitor scrolls the hero past
    // the top of the viewport, the sun leans in closer.
    const ZOOM_MAX = 1.7;
    let scrollProgress = 0;
    let zoomScale = 1;
    function onScroll() {
      const rect = shellEl.getBoundingClientRect();
      const heroHeight = rect.height || window.innerHeight;
      const scrolledPast = -rect.top;
      scrollProgress = THREE.MathUtils.clamp(scrolledPast / (heroHeight * 0.65), 0, 1);
      if (reducedMotion) render();
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // Drag-to-spin: touch or mouse-drag rotates only The Sun.
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartYaw = 0;
    let dragStartPitch = 0;
    let dragYaw = 0;
    let dragPitch = 0;

    let lastPoundHitId = -1;
    const sunCenterWorld = new THREE.Vector3();
    const fistAimWorld = new THREE.Vector3();
    const impactDirection = new THREE.Vector3();
    const impactSurfaceWorld = new THREE.Vector3();
    const impactSurfaceLocal = new THREE.Vector3();

    function smoothUnit(value) {
      const clamped = THREE.MathUtils.clamp(value, 0, 1);
      return clamped * clamped * (3 - 2 * clamped);
    }

    function onPointerMove(event) {
      if (isDragging) return;
      const bounds = shellEl.getBoundingClientRect();
      const fracX = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
      const fracY = THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
      targetYaw = fracX * maxYaw;
      targetPitch = fracY * maxPitch;
      pointerActive = true;
      lastPointer = performance.now();
      if (reducedMotion) render();
    }
    function onPointerLeave() {
      if (!isDragging) pointerActive = false;
    }
    function onStageDragStart(event) {
      isDragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragStartYaw = dragYaw = solarYaw;
      dragStartPitch = dragPitch = solarPitch;
      pointerActive = true;
      lastPointer = performance.now();
      window.addEventListener("pointermove", onWindowDragMove);
      window.addEventListener("pointerup", onWindowDragEnd);
      window.addEventListener("pointercancel", onWindowDragEnd);
    }
    function onWindowDragMove(event) {
      const bounds = shellEl.getBoundingClientRect();
      const dx = event.clientX - dragStartX;
      const dy = event.clientY - dragStartY;
      dragYaw = dragStartYaw + (dx / bounds.width) * THREE.MathUtils.degToRad(380);
      dragPitch = THREE.MathUtils.clamp(
        dragStartPitch - (dy / bounds.height) * THREE.MathUtils.degToRad(220),
        -maxDragPitch,
        maxDragPitch,
      );
      lastPointer = performance.now();
      if (reducedMotion) render();
    }
    function onWindowDragEnd() {
      isDragging = false;
      pointerActive = false;
      window.removeEventListener("pointermove", onWindowDragMove);
      window.removeEventListener("pointerup", onWindowDragEnd);
      window.removeEventListener("pointercancel", onWindowDragEnd);
    }
    // Bound once to the persistent shell — it moves between pages via
    // appendChild (which relocates, not clones), so these never need to
    // be re-attached per page.
    shellEl.addEventListener("pointermove", onPointerMove, { passive: true });
    shellEl.addEventListener("pointerleave", onPointerLeave, { passive: true });
    shellEl.addEventListener("pointerdown", onStageDragStart);

    function render(now = performance.now()) {
      const delta = Math.min(0.08, (now - lastFrame) / 1000);
      lastFrame = now;
      elapsed += delta;
      const damping = reducedMotion ? 1 : 1 - Math.pow(0.0015, delta || 0.016);
      if (isDragging) {
        solarYaw = dragYaw;
        solarPitch = dragPitch;
        yaw += (0 - yaw) * damping;
        pitch += (0 - pitch) * damping;
      } else {
        if (!reducedMotion) solarYaw += delta * 0.18;
        const idle = !pointerActive || now - lastPointer > 2600;
        const desiredYaw = idle && !reducedMotion ? Math.sin(elapsed * 0.2) * maxYaw * 0.34 : targetYaw;
        const desiredPitch = idle && !reducedMotion ? Math.sin(elapsed * 0.15 + 1.2) * maxPitch * 0.36 : targetPitch;
        yaw += (desiredYaw - yaw) * damping;
        pitch += (desiredPitch - pitch) * damping;
      }
      solarSystemGroup.rotation.y = solarYaw;
      solarSystemGroup.rotation.x = solarPitch;
      robotGroup.rotation.y = yaw;
      robotGroup.rotation.x = pitch;
      const desiredZoom = 1 + scrollProgress * ZOOM_MAX;
      zoomScale += (desiredZoom - zoomScale) * (reducedMotion ? 1 : 1 - Math.pow(0.0025, delta || 0.016));
      robotGroup.scale.setScalar(zoomScale);
      swarmBack.scale.setScalar(zoomScale);
      swarmFront.scale.setScalar(zoomScale);
      sunGlow.scale.setScalar(zoomScale);
      const zoomShift = (zoomScale - 1) * HEAD_ANCHOR_Y;
      solarSystemGroup.position.y = 0.45 - zoomShift;
      sunGlow.position.y = 0.45 - zoomShift;
      robotGroup.position.y = -zoomShift;

      const poundCycleIndex = Math.floor(elapsed / POUND_CYCLE);
      const poundCycleTime = elapsed - poundCycleIndex * POUND_CYCLE;
      let impactStrength = 0;
      let impactPhase = 0;
      let impactSide = 1;

      if (!reducedMotion) {
        POUND_HITS.forEach((hit) => {
          const sinceContact = poundCycleTime - hit.time;
          if (sinceContact >= 0 && sinceContact <= 1.05) {
            const phase = sinceContact / 1.05;
            const strength = Math.pow(1 - phase, 2.2);
            if (strength > impactStrength) {
              impactStrength = strength;
              impactPhase = phase;
              impactSide = hit.side;
            }
          }
        });
      }

      solarSystemGroup.updateMatrixWorld(true);
      robotGroup.updateMatrixWorld(true);
      swarmFront.updateMatrixWorld(true);
      sunCenterWorld.set(0, 0, 0);
      solarSystemGroup.localToWorld(sunCenterWorld);
      fistAimWorld.set(impactSide * 0.55, 0.0, 4.8);
      robotGroup.localToWorld(fistAimWorld);
      impactDirection.copy(fistAimWorld).sub(sunCenterWorld).normalize();
      impactSurfaceWorld.copy(sunCenterWorld).addScaledVector(impactDirection, 5.02 * zoomScale);
      impactSurfaceLocal.copy(impactSurfaceWorld);
      swarmFront.worldToLocal(impactSurfaceLocal);
      swarmBackMaterial.uniforms.uImpactCenter.value.copy(impactSurfaceLocal);
      swarmFrontMaterial.uniforms.uImpactCenter.value.copy(impactSurfaceLocal);
      swarmBackMaterial.uniforms.uImpactStrength.value = impactStrength;
      swarmFrontMaterial.uniforms.uImpactStrength.value = impactStrength;
      swarmBackMaterial.uniforms.uImpactPhase.value = impactPhase;
      swarmFrontMaterial.uniforms.uImpactPhase.value = impactPhase;

      sunGlowMaterial.uniforms.uTime.value = elapsed;
      swarmBackMaterial.uniforms.uTime.value = elapsed;
      swarmFrontMaterial.uniforms.uTime.value = elapsed;
      dustMaterial.uniforms.uTime.value = elapsed;
      dust.rotation.y = elapsed * 0.018;
      iconMaterial.uniforms.uTime.value = elapsed;
      composer.render();
      if (running && !reducedMotion) frame = requestAnimationFrame(render);
    }

    function start() {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      resize();
      onScroll();
      render();
    }
    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    function onVisibilityChange() {
      if (document.hidden) cancelAnimationFrame(frame);
      else if (running && !reducedMotion) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(render);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    let attachedWrapper = null;
    let attachCount = 0;
    function attach(wrapper) {
      attachCount += 1;
      if (attachedWrapper !== wrapper) {
        wrapper.appendChild(shellEl);
        attachedWrapper = wrapper;
      }
      start();
      // A container that just changed size (or just entered the layout)
      // needs one resize on the next frame once layout has settled.
      requestAnimationFrame(resize);
    }
    function detach(wrapper) {
      attachCount = Math.max(0, attachCount - 1);
      if (attachCount > 0) return;
      stop();
      if (attachedWrapper === wrapper) {
        getKeepAliveHost().appendChild(shellEl);
        attachedWrapper = null;
      }
    }

    shared = {
      shellEl, attach, detach, mode: "ready",
    };
    return shared;
  })().catch((error) => {
    initPromise = null;
    throw error;
  });
  return initPromise;
  };
}

const ensureShared = createSharedSunFactory();
const ensureMenuShared = createSharedSunFactory();

export function SunBackground({ onReady, variant = "page" }) {
  const ensure = variant === "menu" ? ensureMenuShared : ensureShared;
  const wrapperRef = useRef(null);
  const [mode, setMode] = useState(() => (supportsWebGL() ? "loading" : "fallback"));

  useEffect(() => {
    onReady?.(mode !== "loading");
  }, [mode, onReady]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || mode === "fallback") return undefined;
    let cancelled = false;
    let attachedShared = null;

    ensure()
      .then((instance) => {
        if (cancelled) return;
        attachedShared = instance;
        instance.attach(wrapper);
        setMode("ready");
      })
      .catch(() => {
        if (!cancelled) setMode("fallback");
      });

    return () => {
      cancelled = true;
      attachedShared?.detach(wrapper);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperClass = variant === "menu" ? "okr__isra-cloud" : "okr__isra-cloud okr__sun-hero-bg";
  return (
    <div ref={wrapperRef} className={wrapperClass} data-mode={mode}>
      {mode === "fallback" && (
        <img className="okr__isra-cloud-fallback" src={FALLBACK_SRC} alt="" aria-hidden="true" loading="lazy" />
      )}
    </div>
  );
}
