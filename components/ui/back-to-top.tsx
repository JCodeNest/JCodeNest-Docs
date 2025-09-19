"use client"

import * as React from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BackToTopProps {
  className?: string
  showOffset?: number // 滚动多少像素后显示按钮
}

export function BackToTop({ className, showOffset = 300 }: BackToTopProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  // 监听滚动事件
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      setIsVisible(scrollTop > showOffset)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始检查

    return () => window.removeEventListener('scroll', handleScroll)
  }, [showOffset])

  // 平滑滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        "fixed right-4 bottom-12 md:right-8 md:bottom-8 z-50",
        "h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg",
        "bg-primary/90 hover:bg-primary hover:scale-110",
        "backdrop-blur-sm transition-all duration-300",
        "animate-in fade-in-0 slide-in-from-bottom-4",
        className
      )}
      onClick={scrollToTop}
      title="返回顶部"
      aria-label="返回顶部"
    >
      <ArrowUp className="h-4 w-4 md:h-5 md:w-5" />
    </Button>
  )
}