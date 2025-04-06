"use client"

import { useState, useEffect } from "react"
import { Code2, Database, Lock, Brain, Camera, Palette, Zap, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"

export default function TechStackCard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById("tech-stack")
      if (element) {
        const position = element.getBoundingClientRect()
        if (position.top < window.innerHeight * 0.75) {
          setIsVisible(true)
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check on initial load

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const technologies = [
    {
      name: "Next.js",
      icon: <Code2 className="h-6 w-6" />,
      description: "Server-side rendering and optimized React framework",
      color: "from-blue-500 to-cyan-400",
      shadowColor: "rgba(59, 130, 246, 0.5)",
      borderColor: "border-blue-500/30",
      bgGlow: "bg-blue-500/10",
    },
    {
      name: "MongoDB",
      icon: <Database className="h-6 w-6" />,
      description: "Flexible document database for storing user goals and progress",
      color: "from-green-500 to-emerald-400",
      shadowColor: "rgba(16, 185, 129, 0.5)",
      borderColor: "border-green-500/30",
      bgGlow: "bg-green-500/10",
    },
    {
      name: "Auth0",
      icon: <Lock className="h-6 w-6" />,
      description: "Secure authentication and user management",
      color: "from-red-500 to-orange-400",
      shadowColor: "rgba(239, 68, 68, 0.5)",
      borderColor: "border-red-500/30",
      bgGlow: "bg-red-500/10",
    },
    {
      name: "Gemini",
      icon: <Brain className="h-6 w-6" />,
      description: "AI model for natural language goal processing",
      color: "from-pink-500 to-rose-400",
      shadowColor: "rgba(236, 72, 153, 0.5)",
      borderColor: "border-pink-500/30",
      bgGlow: "bg-pink-500/10",
    },
    {
      name: "Tailwind CSS",
      icon: <Palette className="h-6 w-6" />,
      description: "Utility-first CSS for responsive, clean interfaces",
      color: "from-cyan-500 to-sky-400",
      shadowColor: "rgba(6, 182, 212, 0.5)",
      borderColor: "border-cyan-500/30",
      bgGlow: "bg-cyan-500/10",
    },
    {
      name: "OpenCV",
      icon: <Camera className="h-6 w-6" />,
      description: "Computer vision for virtual pet animations and interactions",
      color: "from-amber-500 to-yellow-400",
      shadowColor: "rgba(245, 158, 11, 0.5)",
      borderColor: "border-amber-500/30",
      bgGlow: "bg-amber-500/10",
    },
    {
      name: "TensorFlow",
      icon: <Zap className="h-6 w-6" />,
      description: "Machine learning framework for goal prediction and analysis",
      color: "from-indigo-500 to-blue-400",
      shadowColor: "rgba(99, 102, 241, 0.5)",
      borderColor: "border-indigo-500/30",
      bgGlow: "bg-indigo-500/10",
    },
    {
      name: "Nodemailer",
      icon: <Mail className="h-6 w-6" />,
      description: "Email sending functionality for notifications and communications",
      color: "from-purple-500 to-violet-400",
      shadowColor: "rgba(168, 85, 247, 0.5)",
      borderColor: "border-purple-500/30",
      bgGlow: "bg-purple-500/10",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <div id="tech-stack" className="w-full max-w-7xl mx-auto py-20 px-4 relative overflow-hidden">
      {/* Background glow effects - theme aware */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 blur-3xl -z-10"></div>
      <div
        className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${isDarkTheme ? "from-slate-900/0 to-black" : "from-slate-100/0 to-white"} -z-20`}
      ></div>

      {/* Heading with animated underline */}
      <div className="text-center mb-16 relative">
        <motion.h2
          className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
          initial={{ opacity: 0, y: -20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Waddl Waddl Waddl...
        </motion.h2>
        <motion.div
          className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"
          initial={{ width: 0, opacity: 0 }}
          animate={isVisible ? { width: 120, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto mt-6 text-lg"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Waddl combines these powerful technologies to create a seamless, intelligent goal-tracking experience
        </motion.p>
      </div>

      {/* Tech cards with vibrant colors and animations */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={container}
        initial="hidden"
        animate={isVisible ? "show" : "hidden"}
      >
        {technologies.map((tech, index) => (
          <motion.div
            key={tech.name}
            className={`
              relative rounded-xl overflow-hidden backdrop-blur-sm
              border ${tech.borderColor}
              ${hoveredIndex === index ? tech.bgGlow : isDarkTheme ? "bg-black/40" : "bg-white/40"}
              transition-all duration-300
            `}
            style={{
              boxShadow: hoveredIndex === index ? `0 0 25px ${tech.shadowColor}` : "none",
            }}
            variants={item}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Animated gradient background on hover */}
            <div
              className={`
                absolute inset-0 bg-gradient-to-br ${tech.color} opacity-0
                ${hoveredIndex === index ? "opacity-10" : ""}
                transition-opacity duration-300
              `}
            />

            {/* Card content */}
            <div className="p-6 relative z-10">
              <div className="flex flex-col items-center text-center">
                {/* Icon with gradient background */}
                <div
                  className={`
                  rounded-full p-4 mb-5
                  bg-gradient-to-br ${tech.color}
                  shadow-lg
                `}
                >
                  {tech.icon}
                </div>

                {/* Name with gradient text on hover */}
                <h3
                  className={`
                  text-xl font-bold mb-3
                  ${
                    hoveredIndex === index
                      ? "bg-clip-text text-transparent bg-gradient-to-r " + tech.color
                      : "text-foreground"
                  }
                  transition-all duration-300
                `}
                >
                  {tech.name}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm">{tech.description}</p>
              </div>
            </div>

            {/* Bottom border accent */}
            <div
              className={`
              h-1 w-0 bg-gradient-to-r ${tech.color}
              ${hoveredIndex === index ? "w-full" : ""}
              transition-all duration-500 ease-out
            `}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
