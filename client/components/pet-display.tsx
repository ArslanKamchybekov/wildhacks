import Image from "next/image"

interface PetDisplayProps {
  type: "dragon" | "phoenix" | "cat"
  stage: number // 0-5
  health: number // 0-100
  size?: "sm" | "md" | "lg"
}

export function PetDisplay({ type, stage, health, size = "md" }: PetDisplayProps) {
  // In a real app, you would have actual pet images for each type and stage
  // For now, we'll use placeholder images

  const getImageSize = () => {
    switch (size) {
      case "sm":
        return { width: 80, height: 80 }
      case "md":
        return { width: 150, height: 150 }
      case "lg":
        return { width: 250, height: 250 }
    }
  }

  const { width, height } = getImageSize()

  // Determine the image based on pet type and stage
  const getImageUrl = () => {
    // This would normally be a real image path
    return `/placeholder.svg?height=${height}&width=${width}`
  }

  // Determine the animation class based on health
  const getHealthClass = () => {
    if (health < 30) return "animate-pulse"
    return ""
  }

  return (
    <div className={`relative ${getHealthClass()}`}>
      <Image
        src={getImageUrl() || "/placeholder.svg"}
        alt={`${type} pet at stage ${stage}`}
        width={width}
        height={height}
        className="rounded-lg"
      />
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-medium">
        {type.charAt(0).toUpperCase() + type.slice(1)} - Stage {stage}
      </div>
    </div>
  )
}

