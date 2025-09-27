"use client"

import * as React from "react"
import { ChevronRight, List, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

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
  const [scrollProgress, setScrollProgress] = React.useState(0)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [desktopOpen, setDesktopOpen] = React.useState(false)

  const slugify = React.useCallback((t: string) =>
    t
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, ""),
  [])

  // 使用已渲染的 DOM 来生成目录，确保与 rehypeSlug 生成的 id 完全一致
  React.useEffect(() => {
    const buildTocFromDom = () => {
      const container = document.querySelector('.prose') || document
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const items: TocItem[] = []
      headings.forEach((h) => {
        const el = h as HTMLElement
        const id = el.id || slugify(el.textContent || "")
        const level = Number(el.tagName.replace('H', ''))
        const title = (el.textContent || '').trim()
        items.push({ id, title, level })
      })
      setTocItems(items)
    }

    // 初始与后续变更
    const timer = window.setTimeout(buildTocFromDom, 0)
    const container = document.querySelector('.prose')
    const observer = new MutationObserver(() => buildTocFromDom())
    if (container) observer.observe(container, { childList: true, subtree: true })

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [content, slugify])

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
          current = element.id || slugify(element.textContent || "")
        }
      })

      setActiveId(current)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始检查

    return () => window.removeEventListener('scroll', handleScroll)
  }, [slugify])

  // 桌面端打开目录时让正文为侧栏腾出空间（并排布局）
  React.useEffect(() => {
    const width = 320 // 侧栏宽度(px)
    const gap = 0    // 与正文的间距(px)
    const apply = () => {
      if (desktopOpen && window.innerWidth >= 768) {
        document.body.style.paddingRight = width + gap + "px"
      } else {
        document.body.style.paddingRight = ""
      }
    }
    apply()
    window.addEventListener("resize", apply)
    return () => {
      window.removeEventListener("resize", apply)
      document.body.style.paddingRight = ""
    }
  }, [desktopOpen])

  // 平滑滚动到指定标题
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id) || 
                   Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                     .find(h => slugify(h.textContent || '') === id)

    if (element) {
      const offset = 80
      const top = (element as HTMLElement).getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (!tocItems.length) return null

  return (
    <>
      {/* 桌面端右侧并排侧栏目录（无蒙层） */}
      <div className={cn("hidden md:block", className)}>
        {/* 右壁中部触发器：简约竖向标签 */}
        <button
          type="button"
          onClick={() => setDesktopOpen((v) => !v)}
          title="文章目录"
          className={cn(
            "fixed right-0 top-1/2 -translate-y-1/2 z-40",
            "h-24 w-8 rounded-l-md rounded-r-none",
            "bg-background/95 text-foreground border border-border/60 shadow-md",
            "flex items-center justify-center"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", desktopOpen ? "-rotate-180" : "")} />
        </button>

        {/* 右侧固定侧栏：展开时占位并与正文并排 */}
        <div
          className={cn(
            "fixed right-0 top-0 bottom-0 z-30",
            "w-[320px] border-l bg-background",
            "transition-transform duration-300",
            desktopOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="complementary"
          aria-label="文章目录侧栏"
        >
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-foreground">文章目录</h3>
            </div>

            <div className="px-3 pb-4 flex-1 min-h-0 overflow-y-auto">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setDesktopOpen(false)
                    setTimeout(() => scrollToHeading(item.id), 60)
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-md text-sm transition-all duration-200",
                    "hover:bg-muted/50 hover:text-foreground",
                    "flex items-center gap-2 group",
                    activeId === item.id && "bg-primary/10 text-primary border-l-2 ml-2"
                  )}
                  style={{ paddingLeft: `${(item.level - 1) * 12 + 10}px` }}
                >
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 text-muted-foreground transition-transform",
                      "group-hover:text-foreground group-hover:translate-x-0.5",
                      activeId === item.id && "text-primary"
                    )}
                  />
                  <span
                    className={cn(
                      "truncate flex-1",
                      item.level === 1 && "font-semibold",
                      item.level === 2 && "font-medium",
                      item.level >= 3 && "text-muted-foreground font-normal"
                    )}
                  >
                    {item.title}
                  </span>
                </button>
              ))}
            </div>

            <div className="px-3 pb-3 border-t">
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
        <div className="fixed top-0 left-0 right-0 z-20 h-1 bg-muted/30">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
            style={{ width: `${Math.max(0, scrollProgress)}%` }}
          />
        </div>
      </div>

    {/* 移动端抽屉目录 */}
    <div className="md:hidden">
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen} direction="bottom">
        <DrawerTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-24 right-4 h-10 w-10 rounded-full shadow-lg bg-primary text-primary-foreground z-50"
            title="文章目录"
          >
            <List className="h-4 w-4" />
          </Button>
        </DrawerTrigger>

        <DrawerContent className="[&>div:first-child]:hidden">
          <DrawerHeader>
            <DrawerTitle>文章目录</DrawerTitle>
          </DrawerHeader>

          <div className="px-3 pb-4 max-h-[70vh] overflow-y-auto">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setMobileOpen(false); setTimeout(() => scrollToHeading(item.id), 60) }}
                className={cn(
                  "w-full text-left py-3 px-2 rounded-md text-base",
                  "hover:bg-muted/50",
                  activeId === item.id && "bg-primary/10 text-primary"
                )}
                style={{ paddingLeft: `${(item.level - 1) * 16 + 8}px` }}
              >
                {item.title}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
    </>
  )
}