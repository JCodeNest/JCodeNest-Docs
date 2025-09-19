"use client"

import * as React from "react"
import Image from "next/image"
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, X, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { cn } from "@/lib/utils"

interface ImagePreviewProps {
  src: string
  alt?: string
  children?: React.ReactNode
  className?: string
}

export function ImagePreview({ src, alt = "", children, className }: ImagePreviewProps) {
  const [scale, setScale] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
  const [isOpen, setIsOpen] = React.useState(false)
  
  // 重置状态
  const resetTransform = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }
  
  // 当对话框打开/关闭时重置状态
  React.useEffect(() => {
    if (!isOpen) {
      resetTransform()
    }
  }, [isOpen])
  
  // 缩放控制
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.1))
  
  // 旋转控制
  const handleRotateRight = () => setRotation(prev => prev + 90)
  const handleRotateLeft = () => setRotation(prev => prev - 90)
  
  // 拖拽控制
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  // 下载图片
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt || 'image'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载图片失败:', error)
    }
  }
  
  // 键盘快捷键
  React.useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case '=':
        case '+':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case 'r':
          e.preventDefault()
          if (e.shiftKey) {
            handleRotateLeft()
          } else {
            handleRotateRight()
          }
          break
        case 'R':
          e.preventDefault()
          resetTransform()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <div className={cn("cursor-pointer", className)}>
            <img src={src} alt={alt} className="rounded-lg border max-w-full h-auto" />
          </div>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none"
        showCloseButton={false}
      >
        {/* 无障碍访问标题 */}
        <VisuallyHidden>
          <DialogTitle>图片预览: {alt || '图片'}</DialogTitle>
        </VisuallyHidden>
        
        {/* 工具栏 */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 rounded-lg p-2 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleZoomOut}
            title="缩小 (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm px-2 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleZoomIn}
            title="放大 (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-white/30" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleRotateLeft}
            title="逆时针旋转 (Shift+R)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleRotateRight}
            title="顺时针旋转 (R)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-white/30" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleDownload}
            title="下载图片"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 h-8 w-8 text-white hover:bg-white/20"
          onClick={() => setIsOpen(false)}
          title="关闭 (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* 重置按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-white hover:bg-white/20 bg-black/50 backdrop-blur-sm"
          onClick={resetTransform}
          title="重置 (Shift+R)"
        >
          重置
        </Button>
        
        {/* 图片容器 */}
        <div 
          className="flex items-center justify-center w-full h-[95vh] overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            className="relative max-w-full max-h-full"
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>
        </div>
        
        {/* 快捷键提示 */}
        <div className="absolute bottom-4 right-4 z-10 text-xs text-white/60 bg-black/30 rounded p-2 backdrop-blur-sm">
          <div>+/- 缩放 • R 旋转 • 拖拽移动 • Esc 关闭</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 用于 Markdown 中图片的增强组件
interface MarkdownImageProps {
  src?: string
  alt?: string
  title?: string
  className?: string
}

export function MarkdownImage({ src, alt, title, className, ...props }: MarkdownImageProps) {
  if (!src) return null
  
  return (
    <ImagePreview src={src} alt={alt || title} className={className}>
      <img
        src={src}
        alt={alt}
        title={title}
        className={cn(
          "rounded-lg border max-w-full h-auto my-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        {...props}
      />
    </ImagePreview>
  )
}