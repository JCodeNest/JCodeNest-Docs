"use client"

import * as React from "react"
import { ChevronRight, List, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TocItem {
  id: string
  title: string
  level: number
  children?: TocItem[]
}

interface TableOfContentsProps {
  content: string
  className?: string
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [tocItems, setTocItems] = React.useState<TocItem[]>([])
  const [activeId, setActiveId] = React.useState<string>("")
  const [isVisible, setIsVisible] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [scrollProgress, setScrollProgress] = React.useState(0)

  // 解析Markdown内容生成目录
  React.useEffect(() => {
    const parseHeadings = () => {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm
      const headings: TocItem[] = []
      let match

      while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length
        const title = match[2].trim()
        const id = title
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '')

        headings.push({
          id,
          title,
          level,
        })
      }

      setTocItems(headings)
    }

    if (content) {
      parseHeadings()
    }
  }, [content])

  // 监听滚动，高亮当前章节
  React.useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // 计算滚动进度
      const progress = Math.min(100, (scrollTop / (documentHeight - windowHeight)) * 100)
      setScrollProgress(progress)

      let current = ""
      
      headings.forEach((heading) => {
        const element = heading as HTMLElement
        const offsetTop = element.offsetTop
        
        if (offsetTop <= scrollTop + windowHeight / 3) {
          current = element.id || element.textContent?.toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '') || ""
        }
      })

      setActiveId(current)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始检查

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 平滑滚动到指定标题
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id) || 
                   Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                     .find(h => {
                       const generatedId = h.textContent?.toLowerCase()
                         .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
                         .replace(/\s+/g, '-')
                         .replace(/^-+|-+$/g, '')
                       return generatedId === id
                     })

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  if (!tocItems.length) return null

  return (
    <div className={cn("fixed right-8 top-24 z-50", className)}>
      {/* 悬浮触发区域 - 扩大悬停区域 */}
      <div
        className="relative"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => {
          // 延迟隐藏，给用户时间移动到目录面板
          setTimeout(() => {
            if (!isExpanded) {
              setIsVisible(false)
            }
          }, 200)
        }}
      >
        {/* 触发按钮 */}
        <Button
          variant={isVisible || isExpanded ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg transition-all duration-300",
            "bg-background/90 backdrop-blur-sm border-border/50",
            "hover:bg-primary hover:text-primary-foreground hover:scale-110",
            (isVisible || isExpanded) && "bg-primary text-primary-foreground scale-110"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          title="文章目录"
        >
          <List className="h-5 w-5" />
        </Button>

        {/* 目录面板 - 修复高度和布局 */}
        <div
          className={cn(
            "absolute right-16 top-0 w-80 transition-all duration-300 origin-top-right",
            "bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl",
            "max-h-[70vh] flex flex-col", // 限制最大高度为70%视口高度
            isVisible || isExpanded 
              ? "opacity-100 scale-100 translate-x-0" 
              : "opacity-0 scale-95 translate-x-4 pointer-events-none"
          )}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => {
            // 延迟隐藏，给用户时间操作
            setTimeout(() => {
              if (!isExpanded) {
                setIsVisible(false)
              }
            }, 300)
          }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
            <h3 className="text-sm font-semibold text-foreground">文章目录</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "收起目录" : "固定展开"}
              >
                {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* 目录内容 - 修复滚动问题和滚动条 */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div 
              className="h-full overflow-y-auto scrollbar-thin"
              style={{
                maxHeight: 'calc(70vh - 8rem)', // 确保高度限制
                scrollbarWidth: 'thin',
                scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent'
              }}
              onWheel={(e) => {
                // 阻止事件冒泡，确保滚动只作用于目录区域
                e.stopPropagation()
              }}
            >
              <div className="p-2 space-y-1">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-md text-sm transition-all duration-200",
                      "hover:bg-muted/50 hover:text-foreground",
                      "flex items-center gap-2 group",
                      activeId === item.id && "bg-primary/10 text-primary border-l-2 border-primary ml-2"
                    )}
                    style={{
                      paddingLeft: `${(item.level - 1) * 12 + 10}px`
                    }}
                  >
                    <ChevronRight 
                      className={cn(
                        "h-3 w-3 text-muted-foreground transition-transform",
                        "group-hover:text-foreground group-hover:translate-x-0.5",
                        activeId === item.id && "text-primary"
                      )} 
                    />
                    <span className={cn(
                      "truncate flex-1",
                      item.level === 1 && "font-semibold",
                      item.level === 2 && "font-medium",
                      item.level >= 3 && "text-muted-foreground font-normal"
                    )}>
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="p-3 border-t border-border/50 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>点击标题快速跳转</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{Math.round(scrollProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-muted/30">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
          style={{
            width: `${Math.max(0, scrollProgress)}%`
          }}
        />
      </div>
    </div>
  )
}