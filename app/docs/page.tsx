"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { MarkdownArticle } from "@/components/ui/markdown-variants"

// 创建一个内容上下文来管理当前选中的文档
const ContentContext = React.createContext<{
  currentPath: string | null
  setCurrentPath: (path: string | null) => void
  content: string
  loading: boolean
  error: string | null
}>({
  currentPath: null,
  setCurrentPath: () => {},
  content: '',
  loading: false,
  error: null
})

export const useContent = () => React.useContext(ContentContext)

// 内容提供者组件
function ContentProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const [currentPath, setCurrentPath] = React.useState<string | null>(null)
  const [content, setContent] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // 初始化时从 URL 参数获取路径
  React.useEffect(() => {
    const pathFromUrl = searchParams.get('path')
    if (pathFromUrl) {
      setCurrentPath(pathFromUrl)
    }
  }, [searchParams])

  // 当路径变化时加载内容
  React.useEffect(() => {
    if (!currentPath) {
      setContent("# 欢迎来到 JCodeNest 文档\n\n请从左侧菜单选择要查看的文档。")
      setError(null)
      return
    }

    const fetchContent = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/content?path=${encodeURIComponent(currentPath)}`)
        
        if (!response.ok) {
          throw new Error("文档加载失败")
        }
        
        const data = await response.json()
        setContent(data.content)
        
        // 更新 URL 但不刷新页面
        const newUrl = `/docs?path=${encodeURIComponent(currentPath)}`
        window.history.replaceState({}, '', newUrl)
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "未知错误"
        setError(errorMsg)
        setContent("# 错误\n\n无法加载文档内容。")
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [currentPath])

  const contextValue = {
    currentPath,
    setCurrentPath,
    content,
    loading,
    error
  }

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  )
}

// 文档内容显示组件
function DocumentContent() {
  const { currentPath, content, loading, error } = useContent()

  // 从文件路径解析面包屑
  const breadcrumbs = React.useMemo(() => {
    if (!currentPath) {
      return [{ title: "首页", isPage: true, href: undefined }]
    }
    
    const parts = currentPath.split('/')
    const breadcrumbItems: Array<{ title: string; isPage?: boolean; href?: string }> = []
    
    // 添加根目录
    breadcrumbItems.push({ title: "文档", href: "/docs" })
    
    // 添加路径中的每一层
    parts.forEach((part: string, index: number) => {
      const isLastItem = index === parts.length - 1
      const title = part.replace(/^\d+-/, '').replace(/\.md$/, '') // 移除数字前缀和.md扩展名
      
      if (isLastItem) {
        breadcrumbItems.push({ title, isPage: true })
      } else {
        breadcrumbItems.push({ title, href: "#" })
      }
    })
    
    return breadcrumbItems
  }, [currentPath])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                    {item.isPage ? (
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href || "#"}>
                        {item.title}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      
      <div className="flex flex-1 flex-col gap-4 p-6 pt-0 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">正在加载文档...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">错误: {error}</div>
          </div>
        ) : (
          <div className="w-full">
            <MarkdownArticle currentPath={currentPath || undefined}>
              {content}
            </MarkdownArticle>
          </div>
        )}
      </div>
    </>
  )
}

export default function DocsPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-muted-foreground">加载中...</div>}>
      <ContentProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DocumentContent />
        </SidebarInset>
      </SidebarProvider>
      </ContentProvider>
    </React.Suspense>
  )
}