"use client"

import { useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Gamepad2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

type ArenaPortalTriggerProps = {
  className?: string
  targetHref: string
  label?: string
  showGamepadIcon?: boolean
  showArrowIcon?: boolean
}

export const ArenaPortalTrigger = ({ 
  className, 
  targetHref, 
  label = "Enter Gamification Arena",
  showGamepadIcon = false,
  showArrowIcon = true
}: ArenaPortalTriggerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const handleTransition = useCallback(async () => {
    if (!buttonRef.current || !document.startViewTransition) {
      router.push(targetHref)
      return
    }

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY)
    )

    // Add 2.5 second delay before transition
    await new Promise(resolve => setTimeout(resolve, 2500))

    // 1. Start the View Transition
    const transition = document.startViewTransition(() => {
      // Navigate to the new page during the transition
      router.push(targetHref)
    })

    // 2. Animate the Circular Reveal on the "New" view
    await transition.ready

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
        ],
      },
      {
        duration: 800,
        easing: "ease-in-out",
        // This targets the new incoming page
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [router, targetHref])

  return (
    <button
      ref={buttonRef}
      onClick={handleTransition}
      className={cn(
        "group flex items-center justify-center gap-2 w-full p-3 rounded-lg transition-all",
        "hover:bg-primary/10 text-slate-400 hover:text-white",
        className
      )}
      type="button"
    >
      {showGamepadIcon && <Gamepad2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
      <span className="font-medium">{label}</span>
      {showArrowIcon && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
    </button>
  )
}
