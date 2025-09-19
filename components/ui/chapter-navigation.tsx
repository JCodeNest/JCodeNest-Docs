"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ChapterInfo {
  title: string
  path: string
  url: string
}

interface ChapterNavigationProps {
  currentPath?: string
  className?: string
}

// 获取所有文档的扁平化列表
async function getAllDocuments(): Promise<ChapterInfo[]> {
  try {
    const response = await fetch('/api/content-tree')
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    const documents: ChapterInfo[] = []
    
    type NavItem = { title: string; url?: string; items?: unknown[] }
    const isNavItem = (obj: unknown): obj is NavItem =>
      typeof obj === 'object' && obj !== null && 'title' in obj

    // 递归提取所有文档
    function extractDocs(items: unknown[], basePath = '') {
      items.forEach((item) => {
        if (!isNavItem(item)) return
        if (Array.isArray(item.items) && item.items.length > 0) {
          // 这是一个目录，递归处理子项
          extractDocs(item.items, basePath)
        } else if (typeof item.url === 'string' && item.url.includes('/docs?path=')) {
          // 这是一个文档文件
          const pathMatch = item.url.match(/path=([^&]+)/)
          if (pathMatch) {
            documents.push({
              title: item.title,
              path: decodeURIComponent(pathMatch[1]),
              url: item.url
            })
          }
        }
      })
    }
    
    extractDocs(Array.isArray(data.navMain) ? data.navMain : [])
    
    // 添加调试信息
    // console.log('Extracted documents:', documents)
    
    return documents
  } catch (error) {
    console.error('Failed to load documents:', error)
    return []
  }
}

export function ChapterNavigation({ currentPath, className }: ChapterNavigationProps) {
  const [documents, setDocuments] = React.useState<ChapterInfo[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    getAllDocuments()
      .then((docs) => {
        setDocuments(docs)
      })
      .catch((err) => {
        console.error('Chapter navigation error:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading || !currentPath) {
    return null
  }

  // 找到当前文档的索引
  const currentIndex = documents.findIndex(doc => doc.path === currentPath)
  
  if (currentIndex === -1) {
    return null
  }

  const previousChapter = currentIndex > 0 ? documents[currentIndex - 1] : null
  const nextChapter = currentIndex < documents.length - 1 ? documents[currentIndex + 1] : null

  // 如果没有上一章和下一章，则不显示导航
  if (!previousChapter && !nextChapter) {
    return null
  }

  return (
    <div className={cn("mt-12 pt-8", className)}>
      <Separator className="mb-8" />
      
      <nav
        className="flex items-stretch gap-4"
        aria-label="章节导航"
      >
        {/* 上一章 */}
        <div className="flex-1 flex justify-start">
          {previousChapter ? (
            <Link href={previousChapter.url} className="group block w-full max-w-md">
              <Button
                variant="ghost"
                className="h-auto p-4 justify-start text-left w-full"
              >
                <div className="flex items-center gap-3 min-w-0 w-full">
                  <ChevronLeftIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                      上一章
                    </span>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                      {previousChapter.title}
                    </span>
                  </div>
                </div>
              </Button>
            </Link>
          ) : (
            <div className="w-full max-w-md" /> // 占位符，保持布局平衡
          )}
        </div>

        {/* 中间图标 */}
        <div className="flex-shrink-0 flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* 下一章 */}
        <div className="flex-1 flex justify-end">
          {nextChapter ? (
            <Link href={nextChapter.url} className="group block w-full max-w-md">
              <Button
                variant="ghost"
                className="h-auto p-4 justify-end text-right w-full"
              >
                <div className="flex items-center gap-3 min-w-0 w-full">
                  <div className="flex flex-col gap-1 min-w-0 flex-1 text-right">
                    <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                      下一章
                    </span>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                      {nextChapter.title}
                    </span>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
              </Button>
            </Link>
          ) : (
            <div className="w-full max-w-md" /> // 占位符，保持布局平衡
          )}
        </div>
      </nav>
    </div>
  )
}

// 简化版本的章节导航（只显示箭头和标题）
export function SimpleChapterNavigation({ currentPath, className }: ChapterNavigationProps) {
  const [documents, setDocuments] = React.useState<ChapterInfo[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    getAllDocuments().then((docs) => {
      setDocuments(docs)
      setLoading(false)
    })
  }, [])

  if (loading || !currentPath) {
    return null
  }

  const currentIndex = documents.findIndex(doc => doc.path === currentPath)
  if (currentIndex === -1) return null

  const previousChapter = currentIndex > 0 ? documents[currentIndex - 1] : null
  const nextChapter = currentIndex < documents.length - 1 ? documents[currentIndex + 1] : null

  if (!previousChapter && !nextChapter) return null

  return (
    <div className={cn("flex items-center justify-between gap-4 mt-8 pt-6 border-t", className)}>
      {previousChapter ? (
        <Link href={previousChapter.url}>
          <Button variant="outline" className="gap-2">
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">上一章</span>
          </Button>
        </Link>
      ) : (
        <div />
      )}

      {nextChapter ? (
        <Link href={nextChapter.url}>
          <Button variant="outline" className="gap-2">
            <span className="hidden sm:inline">下一章</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}