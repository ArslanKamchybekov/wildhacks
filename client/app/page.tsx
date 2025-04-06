"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Trophy, Users, Code } from "lucide-react";
import { createUser } from "@/app/actions/user";
import { useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DragControls } from "three/examples/jsm/controls/DragControls.js";
import TechStackCard from "@/components/tech-stack-card";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useUser();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Create user if authenticated
  useEffect(() => {
    if (user) {
      createUser({
        name: user.name!,
        email: user.email!,
        tickData: [],
      });
    }
  }, [user]);

  // Set up 3JS duck model with drag controls and enhanced movement effect
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 0); // transparent background

    // Clear any previous content and attach the renderer
    canvasRef.current.innerHTML = "";
    canvasRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add a faint grid outline
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Create a group for the duck model
    const duckGroup = new THREE.Group();
    scene.add(duckGroup);

    // Flag to pause rotation while dragging
    let isDragging = false;

    // Load the duck model
    const loader = new GLTFLoader();
    loader.load(
      "/toon_ducks.glb",
      (gltf) => {
        const duck = gltf.scene;
        duck.scale.set(1.25, 1.25, 1.25);
        duckGroup.add(duck);
      },
      undefined,
      (error) => {
        console.error("Error loading duck model:", error);
      }
    );

    // Setup drag controls for the duckGroup
    const dragControls = new DragControls(
      [duckGroup],
      camera,
      renderer.domElement
    );
    dragControls.addEventListener("dragstart", () => {
      isDragging = true;
    });
    dragControls.addEventListener("dragend", () => {
      isDragging = false;
    });

    // Animation loop: rotate the duck (when not dragging) and render the scene
    let direction = 1;
    const speed = 0.05;
    const maxBounceHeight = 1.0;
    const maxWaddleAngle = 0.1;

    const animate = () => {
      requestAnimationFrame(animate);
      if (!isDragging) {
        duckGroup.rotation.y += 0.01;
        duckGroup.position.y += speed * direction;
        duckGroup.rotation.z = Math.sin(Date.now() * 0.005) * maxWaddleAngle;
        if (
          duckGroup.position.y > maxBounceHeight ||
          duckGroup.position.y < 0
        ) {
          direction *= -1;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    // Handle resizing
    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      dragControls.dispose();
      renderer.dispose();
    };
  }, []);

  const features = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "AI-Powered Goals",
      description:
        "Enter your goal in natural language and our AI breaks it down into achievable milestones.",
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Fun Stakes",
      description:
        "Choose between growing a virtual pet or putting money on the line. Real consequences for real results.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Social Accountability",
      description:
        "Invite friends, compare progress, and climb the leaderboard to stay motivated.",
    },
    {
      icon: <Code className="h-8 w-8 text-primary" />,
      title: "Selenium Automation",
      description:
        "Automate your testing with Selenium for reliable and efficient results.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative py-32 md:py-40 overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.05) 25%, transparent 25%)",
            backgroundSize: "40px 40px",
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="container relative mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Text content */}
              <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 animate-fadeIn">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-800">
                  Your Honor. <br /> Your Wallet. <br /> Your Duck. <br />
                </h1>
                <p className="max-w-[42rem] text-lg text-muted-foreground sm:text-xl leading-relaxed">
                  Set goals, choose your stakes – grow a virtual pet or put
                  money on the line. Let AI help you break down your goals and
                  stay on track.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="gap-2 px-8 py-6 text-lg transition-transform duration-300 hover:scale-105"
                    >
                      Get Started <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 3D Duck model */}
              <div className="flex-1 hidden md:block relative animate-slideIn">
                <div
                  ref={canvasRef}
                  className="w-full h-[500px] rounded-lg shadow-2xl overflow-hidden"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="relative group flex flex-col items-center space-y-4 rounded-xl border bg-card p-8 text-center transition-all hover:shadow-lg hover:border-primary/20 hover:scale-105"
                >
                  {/* Animated SVG overlay for a single-line tracing border effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    <motion.svg
                      className="w-full h-full"
                      viewBox="0 0 400 400"
                      preserveAspectRatio="none"
                    >
                      <motion.rect
                        x="1"
                        y="1"
                        width="398"
                        height="398"
                        rx="10"
                        ry="10"
                        fill="none"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="2"
                        pathLength="1"
                        strokeDasharray="0.1 0.9"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: 1 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </motion.svg>
                  </div>
                  {/* Card Content */}
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="flex items-center justify-center rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mt-4">{feature.title}</h3>
                    <p className="text-muted-foreground text-lg">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <TechStackCard />

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur-sm">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row px-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Waddl. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
