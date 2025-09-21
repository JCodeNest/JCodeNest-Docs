import * as React from "react"
import { Markdown } from "@/components/ui/markdown"
import { TableOfContents } from "@/components/ui/table-of-contents"
import { BackToTop } from "@/components/ui/back-to-top"
import { ChapterNavigation } from "@/components/ui/chapter-navigation"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { Lock, Unlock } from "lucide-react"

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
  currentPath, 
  ...props 
}: Omit<React.ComponentProps<typeof Markdown>, 'variant'> & {
  currentPath?: string
}) {
  // 解析 frontmatter 的 password 字段（true/false，默认 false）
  const parsePasswordFlag = React.useCallback((src: string): boolean => {
    // 仅在开头匹配 frontmatter
    const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
    if (!m) return false
    const block = m[1]
    // 粗粒度解析：逐行找 password: 值
    const lines = block.split(/\r?\n/)
    for (const line of lines) {
      const mm = line.match(/^\s*password\s*:\s*(.+)\s*$/i)
      if (mm) {
        const v = mm[1].trim().toLowerCase()
        return v === "true" || v === "yes" || v === "1"
      }
    }
    return false
  }, [])

  const isProtected = React.useMemo(() => parsePasswordFlag(children), [children, parsePasswordFlag])
  const [inputPwd, setInputPwd] = React.useState("")
  const [unlocked, setUnlocked] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onUnlock = React.useCallback(() => {
    const expected = siteConfig?.security?.docPassword || ""
    if (!expected) {
      // 若未配置密码，则直接放行以避免锁死
      setUnlocked(true)
      setError(null)
      return
    }
    if (inputPwd === expected) {
      setUnlocked(true)
      setError(null)
    } else {
      setError("密码不正确，请重试")
    }
  }, [inputPwd])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onUnlock()
    }
  }

  const renderLocked = () => (
    <div className={cn("relative max-w-none w-full", className)}>
      <div className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/20 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-md bg-blue-100 dark:bg-blue-900/40 p-2">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">加密文档</h3>
            <p className="mt-2 text-blue-700/90 dark:text-blue-300/90">
              本文已被加密，输入正确密码后方可查看内容。
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                className="flex h-10 w-full sm:w-72 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="请输入文档密码"
                value={inputPwd}
                onChange={(e) => setInputPwd(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="文档密码"
              />
              <Button onClick={onUnlock} className="inline-flex items-center gap-1">
                <Unlock className="w-4 h-4" />
                解锁
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="mt-4 text-xs text-foreground/70">
              温馨提示：密码由站点“全局配置”统一管理，若遗忘请联系站长。
            </div>
          </div>
        </div>
      </div>
      {/* 返回顶部保持可用 */}
      <BackToTop />
    </div>
  )

  if (isProtected && !unlocked) {
    return renderLocked()
  }

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