import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform float uTime;
uniform float uBoost;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
varying vec2 vUv;

void main() {
  vec2 base = vUv;
  float t = uTime * 0.38 * uBoost;
  float warpAmp = 0.026 * uBoost;
  vec2 warp = vec2(
    sin(base.y * 14.0 + t * 1.55),
    cos(base.x * 11.0 - t * 1.15)
  ) * warpAmp;
  vec2 uv = base + warp;
  float flow = sin(uv.x * 10.0 + t * 1.2) * cos(uv.y * 8.5 - t * 0.9);
  float ribbons = sin(uv.y * 18.0 + sin(uv.x * 11.0 + t * 1.6)) * 0.5 + 0.5;
  float shimmer = sin(uv.x * 14.0 + uv.y * 6.0 + t * 2.3) * 0.5 + 0.5;
  vec3 col = mix(uColorA, uColorB, ribbons * 0.72 + flow * 0.18);
  col = mix(col, uColorC, shimmer * 0.42);
  float vig = smoothstep(1.45, 0.18, length(uv - 0.5));
  float alpha = (0.14 + ribbons * 0.12 + flow * 0.06 + shimmer * 0.05) * vig * uBoost;
  gl_FragColor = vec4(col * vig, clamp(alpha, 0.0, 0.92));
}
`;

function AuroraPlane({ boost, timeScale }: { boost: boolean; timeScale: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const boostVal = boost ? 1.5 : 1.0;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBoost: { value: boostVal },
      uColorA: { value: new THREE.Vector3(0.38, 0.22, 0.92) },
      uColorB: { value: new THREE.Vector3(0.94, 0.34, 0.62) },
      uColorC: { value: new THREE.Vector3(0.38, 0.74, 0.98) },
    }),
    [boostVal],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta * timeScale;
      matRef.current.uniforms.uBoost.value = boostVal;
    }
  });

  const w = viewport.width * 1.35;
  const h = viewport.height * 1.35;

  return (
    <mesh position={[0, 0, 0]} scale={[w, h, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Scene({ boost, timeScale }: { boost: boolean; timeScale: number }) {
  return <AuroraPlane boost={boost} timeScale={timeScale} />;
}

type Props = {
  /** Stronger aurora + motion (chakra meditation routes). */
  boostChakraRoute?: boolean;
};

export function AuroraBackdrop({ boostChakraRoute = false }: Props) {
  const [timeScale, setTimeScale] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setTimeScale(mq.matches ? 0.22 : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] h-[100dvh] w-full overflow-hidden"
      aria-hidden
    >
      <Suspense fallback={null}>
        <Canvas
          orthographic
          camera={{ position: [0, 0, 10], zoom: 100 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.75]}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <color attach="background" args={["#05030f"]} />
          <Scene boost={boostChakraRoute} timeScale={timeScale} />
        </Canvas>
      </Suspense>
    </div>
  );
}
