"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  mood: "happy" | "sad";
}

function TamagotchiModel({ mood }: Props) {
  const color = new THREE.Color(mood === "happy" ? 0x88ff88 : 0x6688ff);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    let frameId: number;
    let direction = 1;
    const speed = 0.02;
    const maxBounceHeight = 0.5;

    const animate = () => {
      if (meshRef.current) {
        meshRef.current.position.y += speed * direction;
        if (
          meshRef.current.position.y > maxBounceHeight ||
          meshRef.current.position.y < 0
        ) {
          direction *= -1; // Reverse direction when reaching the top or bottom
        }
      }
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]}>
      <meshPhongMaterial color={color} />
    </Sphere>
  );
}

export default function TamagotchiCanvas({ mood }: Props) {
  return (
    <Canvas camera={{ position: [0, 1.5, 5], fov: 40 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 2, 2]} />
      <TamagotchiModel mood={mood} />
      <OrbitControls autoRotate autoRotateSpeed={1.5} enableZoom={false} />
    </Canvas>
  );
}
