"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// GLSL Shaders: Natural Liquid Bubble with Smooth Bottom Fade & Natural Stars
// ─────────────────────────────────────────────────────────────────────────────

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  // 3D Simplex Noise
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Single Natural Bidirectional Fluid Tide (Left -> Right -> Left)
  vec3 getDeformedPosition(vec3 p, float t, vec2 mouse) {
    vec3 pos = p;

    // 1. Base Asymmetric Droplet Shape
    float leftBulge = smoothstep(0.8, -0.6, pos.x) * smoothstep(-1.2, 0.6, pos.y);
    pos.x -= leftBulge * 0.15;
    pos.y += leftBulge * 0.05;

    // 2. Bidirectional Tide Wave Traveling Left -> Right -> Left
    float tideCycle = t * 0.55;
    float waveCenter = sin(tideCycle) * 1.6;

    // Traveling wave crest
    float distFromTide = pos.x - waveCenter;
    float tideHump = exp(-distFromTide * distFromTide * 1.6) * 0.13;

    // Dynamic size breathing
    float sizeModulation = sin(tideCycle + pos.x * 0.5) * 0.05;

    // Vertical envelope
    float verticalEnvelope = smoothstep(-1.4, 0.7, pos.y);

    // Subtle background ripple
    float ripple = snoise(pos * 0.7 + vec3(t * 0.12, t * 0.08, t * 0.06)) * 0.025;

    float totalTideDisp = (tideHump + sizeModulation + ripple) * verticalEnvelope;

    pos += normalize(p) * totalTideDisp;
    return pos;
  }

  void main() {
    vUv = uv;
    
    float time = uTime * 0.6;
    vec3 displaced = getDeformedPosition(position, time, uMouse);
    vPosition = displaced;
    vDisplacement = length(displaced) - length(position);

    // Dynamic normals
    float delta = 0.02;
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    if (length(tangent) < 0.01) tangent = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = cross(normal, tangent);

    vec3 p1 = getDeformedPosition(position + tangent * delta, time, uMouse);
    vec3 p2 = getDeformedPosition(position + bitangent * delta, time, uMouse);

    vec3 calcNormal = normalize(cross(p1 - displaced, p2 - displaced));
    vNormal = normalize(normalMatrix * calcNormal);

    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  vec3 rainbowPalette(float t) {
    vec3 a = vec3(0.55, 0.50, 0.52);
    vec3 b = vec3(0.50, 0.45, 0.48);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.00, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    float NdotV = max(dot(N, V), 0.0);
    float fresnel = 1.0 - NdotV;
    float fresnelEdge = pow(fresnel, 2.4);
    float fresnelRim = pow(fresnel, 4.8);

    float iridT = fresnel * 1.4 + vDisplacement * 1.5 + (vPosition.y * 0.3 + vPosition.x * 0.2) + uTime * 0.05;
    vec3 iridColor = rainbowPalette(iridT);

    vec3 R = reflect(-V, N);

    // Left Sun Highlight
    vec3 sunDir = normalize(vec3(-1.15 + uMouse.x * 0.15, 1.1 + uMouse.y * 0.15, 0.65));
    float RdotL = max(dot(R, sunDir), 0.0);

    float specSoft = pow(RdotL, 20.0);
    float specMedium = pow(RdotL, 64.0);
    float specSharp = pow(RdotL, 180.0);
    float specHotCore = pow(RdotL, 500.0);

    float leftFacing = smoothstep(-0.35, 0.65, -N.x * 0.75 + N.y * 0.6);

    vec3 pureWhite = vec3(1.0, 1.0, 1.0);
    vec3 brightGold = vec3(1.0, 0.88, 0.55);
    vec3 warmAmber = vec3(0.96, 0.68, 0.28);
    vec3 deepBronze = vec3(0.55, 0.32, 0.1);

    // Right Blue Refraction
    vec3 blueLightDir = normalize(vec3(0.9, -0.5, 0.45));
    float RdotBlue = max(dot(R, blueLightDir), 0.0);
    float specBlue = pow(RdotBlue, 32.0);
    float rightFacing = smoothstep(-0.3, 0.8, N.x * 0.8 - N.y * 0.3);

    vec3 sapphireBlue = vec3(0.14, 0.48, 0.96);
    vec3 electricCyan = vec3(0.35, 0.8, 1.0);

    // Top Crest Glint
    vec3 topDir = normalize(vec3(0.0, 1.0, 0.2));
    float specTop = pow(max(dot(R, topDir), 0.0), 50.0);
    float topFacing = smoothstep(0.3, 1.4, vPosition.y);

    // Surface Composite
    vec3 color = vec3(0.012, 0.014, 0.02);

    color += iridColor * (fresnelEdge * 0.7 + 0.03);

    color += deepBronze * specSoft * leftFacing * 0.45;
    color += warmAmber * specMedium * leftFacing * 0.9;
    color += brightGold * specSharp * leftFacing * 1.6;
    color += pureWhite * specHotCore * leftFacing * 2.5;

    color += brightGold * fresnelEdge * leftFacing * 1.4;

    color += sapphireBlue * rightFacing * (fresnelEdge * 0.85 + specBlue * 0.9);
    color += electricCyan * rightFacing * specBlue * 0.6;

    color += brightGold * topFacing * specTop * 0.6;
    color += vec3(0.96, 0.98, 1.0) * fresnelRim * 2.2;

    // Seamless bottom fade
    float bottomFade = smoothstep(-2.2, -0.4, vPosition.y);
    color *= bottomFade;

    float baseAlpha = clamp(
      fresnelEdge * 0.85 + 
      specMedium * leftFacing * 0.9 + 
      specBlue * rightFacing * 0.7 + 
      0.2, 
      0.0, 
      0.98
    );

    gl_FragColor = vec4(color, baseAlpha * bottomFade);
  }
`;

export default function LiquidBubbleCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─────────────────────────────────────────────────────────────────────────
    // Scene, Camera, Renderer Setup
    // ─────────────────────────────────────────────────────────────────────────
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const isMobile = width < 768;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, isMobile ? 5.1 : 4.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────────────────
    // High-Density Organic Liquid Bubble Sphere
    // ─────────────────────────────────────────────────────────────────────────
    const geometry = new THREE.SphereGeometry(2.32, 192, 192);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
    });

    const bubble = new THREE.Mesh(geometry, material);
    bubble.position.set(0, isMobile ? -0.95 : -1.18, 0);
    scene.add(bubble);

    // ─────────────────────────────────────────────────────────────────────────
    // Natural Cosmic Star Dust Particles (Subtle, Soft & Organic)
    // ─────────────────────────────────────────────────────────────────────────
    const particleCount = isMobile ? 65 : 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * (isMobile ? 10 : 16);
      positions[i * 3 + 1] = (Math.random() - 0.5) * (isMobile ? 8 : 10) + 0.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

      scales[i] = Math.random() * 1.4 + 0.5;
      opacities[i] = Math.random() * 0.4 + 0.2;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    particleGeo.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));

    const particleMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aScale;
        attribute float aOpacity;

        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Gentle natural celestial drift
          pos.y += sin(uTime * 0.08 + position.x * 2.0) * 0.06;
          pos.x += cos(uTime * 0.06 + position.y * 2.0) * 0.04;

          // Subtle natural brightness shimmer
          float shimmer = sin(uTime * 0.8 + position.x * 5.0) * 0.15 + 0.85;
          vAlpha = aOpacity * shimmer;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (aScale * 8.5) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Soft Gaussian optical circular falloff (Natural, no harsh cross-glare)
          float intensity = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(0.92, 0.95, 1.0, intensity);
        }
      `,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ─────────────────────────────────────────────────────────────────────────
    // Interaction & Animation Loop
    // ─────────────────────────────────────────────────────────────────────────
    const targetMouse = new THREE.Vector2(0, 0);
    const currentMouse = new THREE.Vector2(0, 0);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouse.set(x * 0.35, y * 0.35);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      uniforms.uTime.value = elapsedTime;
      particleMat.uniforms.uTime.value = elapsedTime;

      // Smooth mouse lerp
      currentMouse.lerp(targetMouse, 0.035);
      uniforms.uMouse.value.copy(currentMouse);

      // Subtle bubble tilt with mouse
      bubble.rotation.y = elapsedTime * 0.02 + currentMouse.x * 0.1;
      bubble.rotation.x = Math.sin(elapsedTime * 0.04) * 0.015 + currentMouse.y * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // ─────────────────────────────────────────────────────────────────────────
    // Responsive Resize Handler (Handles Mobile & Desktop)
    // ─────────────────────────────────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      const mobile = newWidth < 768;

      camera.aspect = newWidth / newHeight;
      camera.position.set(0, 0, mobile ? 5.1 : 4.2);
      bubble.position.set(0, mobile ? -0.95 : -1.18, 0);
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 1 }}
    />
  );
}
