"use client"

import * as React from "react"
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, X, Download, Expand } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { cn } from "@/lib/utils"

interface MermaidPreviewProps {
  svg: string
  title?: string
  children?: React.ReactNode
  className?: string
}

export function MermaidPreview({ svg, title = "Mermaid图表", children, className }: MermaidPreviewProps) {
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
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5))
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
  
  // 下载SVG
  const handleDownload = () => {
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mermaid-diagram-${Date.now()}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载图表失败:', error)
    }
  }
  
  // 复制SVG到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(svg)
      // 可以添加一个toast提示
    } catch (error) {
      console.error('复制失败:', error)
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
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleCopy()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, svg])

  if (!svg) return children || null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <div className={cn("relative group cursor-pointer", className)}>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 shadow-md backdrop-blur-sm"
                title="放大查看"
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-background border"
        showCloseButton={false}
      >
        {/* 无障碍访问标题 */}
        <VisuallyHidden>
          <DialogTitle>Mermaid图表预览: {title}</DialogTitle>
        </VisuallyHidden>
        
        {/* 工具栏 */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/90 rounded-lg p-2 backdrop-blur-sm border shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            title="缩小 (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 min-w-[3rem] text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            title="放大 (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRotateLeft}
            title="逆时针旋转 (Shift+R)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRotateRight}
            title="顺时针旋转 (R)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="下载SVG"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 h-8 w-8"
          onClick={() => setIsOpen(false)}
          title="关闭 (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* 重置按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/90 backdrop-blur-sm border"
          onClick={resetTransform}
          title="重置视图 (Shift+R)"
        >
          重置视图
        </Button>
        
        {/* SVG容器 */}
        <div 
          className="flex items-center justify-center w-full h-[95vh] overflow-hidden cursor-move bg-muted/5"
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
            className="relative select-none"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
        
        {/* 快捷键提示 */}
        <div className="absolute bottom-4 right-4 z-10 text-xs text-muted-foreground bg-background/90 rounded p-2 backdrop-blur-sm border">
          <div>+/- 缩放 • R 旋转 • 拖拽移动 • Ctrl+C 复制 • Esc 关闭</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}