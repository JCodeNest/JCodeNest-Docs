import * as React from "react"
import { Markdown } from "@/components/ui/markdown"
import { TableOfContents } from "@/components/ui/table-of-contents"
import { BackToTop } from "@/components/ui/back-to-top"
import { ChapterNavigation } from "@/components/ui/chapter-navigation"
import { cn } from "@/lib/utils"

// 预定义的配置变体
export const MarkdownPresets = {
  // 文章阅读模式 - 适合长文档、博客文章
  article: {
    variant: "article" as const,
    enableMath: true,
    enableGfm: true,
    showToc: true,
    className: "w-full max-w-none",
  },
  
  // 紧凑模式 - 适合评论、简短内容
  compact: {
    variant: "compact" as const,
    enableMath: false,
    enableGfm: true,
    showToc: false,
    className: "text-sm",
  },
  
  // 卡片模式 - 适合卡片内容展示
  card: {
    variant: "card" as const,
    enableMath: false,
    enableGfm: true,
    showToc: false,
  },
  
  // 文档模式 - 适合技术文档、API文档
  documentation: {
    variant: "default" as const,
    enableMath: true,
    enableGfm: true,
    enableRaw: true,
    showToc: true,
    className: "w-full max-w-none",
  },
  
  // 代码模式 - 重点突出代码块
  code: {
    variant: "default" as const,
    enableMath: false,
    enableGfm: true,
    enableRaw: false,
    showToc: false,
    className: "font-mono text-sm",
  },
  
  // 简单模式 - 最基础的渲染
  simple: {
    variant: "default" as const,
    enableMath: false,
    enableGfm: false,
    enableRaw: false,
    showToc: false,
  }
} as const

export type MarkdownPresetName = keyof typeof MarkdownPresets

interface MarkdownWithPresetProps {
  children: string
  preset?: MarkdownPresetName | "default"
  className?: string
  // 允许覆盖预设配置
  overrides?: Partial<React.ComponentProps<typeof Markdown>>
}

// 带预设的Markdown组件
export function MarkdownWithPreset({
  children,
  preset = "default",
  className,
  overrides = {},
  ...props
}: MarkdownWithPresetProps & Omit<React.ComponentProps<typeof Markdown>, 'children' | 'className'>) {
  const presetConfig = preset !== "default" && preset in MarkdownPresets ? MarkdownPresets[preset as MarkdownPresetName] : {}
  
  const finalProps = {
    ...presetConfig,
    ...overrides,
    ...props,
    className: cn((presetConfig as {className?: string}).className, className, overrides.className),
  }

  return (
    <Markdown {...finalProps}>
      {children}
    </Markdown>
  )
}

// 专用组件变体
export function MarkdownArticle({ 
  children, 
  className,
  currentPath, // 新增当前文档路径参数
  ...props 
}: Omit<React.ComponentProps<typeof Markdown>, 'variant'> & {
  currentPath?: string
}) {
  return (
    <div className="relative">
      <Markdown
        variant="article"
        enableMath={true}
        enableGfm={true}
        showToc={true}
        className={cn("max-w-none w-full", className)}
        {...props}
      >
        {children}
      </Markdown>
      
      {/* 章节导航 */}
      <ChapterNavigation currentPath={currentPath} />
      
      {/* 悬浮目录 */}
      <TableOfContents content={children} />
      
      {/* 返回顶部按钮 */}
      <BackToTop />
    </div>
  )
}

export function MarkdownCard({ 
  children, 
  className, 
  ...props 
}: Omit<React.ComponentProps<typeof Markdown>, 'variant'>) {
  return (
    <Markdown
      variant="card"
      enableMath={false}
      enableGfm={true}
      showToc={false}
      className={className}
      {...props}
    >
      {children}
    </Markdown>
  )
}

export function MarkdownCompact({ 
  children, 
  className, 
  ...props 
}: Omit<React.ComponentProps<typeof Markdown>, 'variant'>) {
  return (
    <Markdown
      variant="compact"
      enableMath={false}
      enableGfm={true}
      showToc={false}
      className={cn("text-sm", className)}
      {...props}
    >
      {children}
    </Markdown>
  )
}

export function MarkdownDocumentation({ 
  children, 
  className, 
  ...props 
}: Omit<React.ComponentProps<typeof Markdown>, 'variant'>) {
  return (
    <Markdown
      variant="default"
      enableMath={true}
      enableGfm={true}
      enableRaw={true}
      showToc={true}
      className={cn("w-full max-w-none", className)}
      {...props}
    >
      {children}
    </Markdown>
  )
}

// Hook for dynamic markdown loading
export function useMarkdownContent(
  source: string | (() => Promise<string>),
  options?: {
    cache?: boolean
    refetch?: boolean
  }
) {
  const [content, setContent] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (typeof source === "string") {
      setContent(source)
      return
    }

    setLoading(true)
    setError(null)
    
    source()
      .then(setContent)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [source])

  return { content, loading, error, refetch: () => {
    if (typeof source === "function") {
      setLoading(true)
      source().then(setContent).catch(setError).finally(() => setLoading(false))
    }
  }}
}

// Utility for markdown content from API
export async function fetchMarkdownContent(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch markdown: ${response.statusText}`)
  }
  return response.text()
}

// 约定标准：文件路径到组件的映射
export const MarkdownRoutes = {
  // 静态文件渲染
  static: (filePath: string) => `/documents/${filePath}`,
  
  // API 接口渲染  
  api: (endpoint: string) => `/api/markdown/${endpoint}`,
  
  // 文档路径
  docs: (docPath: string) => `/documents/${docPath}.md`,
} as const

export {
  Markdown,
}