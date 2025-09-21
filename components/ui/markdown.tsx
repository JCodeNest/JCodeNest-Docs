"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MarkdownImage } from "@/components/ui/image-preview"
import { MermaidCodeBlock } from "@/components/ui/mermaid"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Check, Copy, ExternalLink, Info, AlertTriangle, AlertOctagon } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkToc from "remark-toc"
import type { Pluggable } from "unified"

/**
 * 调试开关：在浏览器控制台执行
 *   window.__MD_DEBUG = true
 * 再刷新即可看到 Markdown 引用块的调试输出
 */
declare global {
  interface Window {
    __MD_DEBUG?: boolean
  }
}
const __mdDebug = (...args: unknown[]): void => {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __MD_DEBUG?: boolean }).__MD_DEBUG
  ) {
    console.log("[MD-BQ]", ...args)
  }
}

// KaTeX CSS import
import "katex/dist/katex.min.css"

// 去除 Markdown 文首 YAML Frontmatter（--- 开头和结尾的元信息块）
function stripFrontmatter(text: string): string {
  // 仅在文件开头匹配，以免误伤正文中的 --- 分隔线
  const frontmatterPattern = /^---\n[\s\S]*?\n---\n?/
  return text.replace(frontmatterPattern, "")
}

/**
 * 将指令块语法转换为引用块，便于后续 blockquote 渲染卡片样式
 * 支持：
 * ::tip 标题
 * 正文...
 * ::
 *
 * ::warning 标题
 * 正文...
 * ::
 *
 * ::error / ::danger 标题
 * 正文...
 * ::
 */
function transformAdmonitionsToBlockquote(src: string): string {
  const pattern = /^[\t \u00A0\u3000]*[:：]{2}(tip|warning|error|danger)[ \t\u00A0\u3000]*(.*)\n([\s\S]*?)\n[\t \u00A0\u3000]*[:：]{2}[ \t]*$/gmi
  return src.replace(pattern, (_m, t: string, title: string, body: string) => {
    // 规范化类型（danger 归一为 error，由 blockquote 解析处理）
    const type = String(t || "").toLowerCase()
    const header = `> ::${type} ${title ?? ""}`.trimEnd()
    const bodyLines = body.split(/\r?\n/).map((line) => `> ${line}`).join("\n")
    return `${header}\n${bodyLines}`
  })
}

/** 引用块嵌套深度上下文：根为 0，嵌套逐层 +1 */
const QuoteDepthCtx = React.createContext(0)

/**
 * 生成 Blockquote 组件（支持 ::tip | ::warning | ::error | ::danger；支持嵌套轻量样式）
 * 保留调试输出，类型安全
 */
function createBlockquote(variant: "default" | "compact" | "article" | "card" | undefined) {
  const Blockquote: React.FC<React.HTMLAttributes<HTMLQuoteElement>> = ({ children, ...props }) => {
    const depth = React.useContext(QuoteDepthCtx)
    const nodes = React.Children.toArray(children)

    // 从 ReactNode 提取纯文本
    const getNodeText = (n: React.ReactNode): string => {
      if (typeof n === "string") return n
      if (Array.isArray(n)) return (n as React.ReactNode[]).map(getNodeText).join("")
      if (React.isValidElement(n)) {
        const el = n as React.ReactElement<{ children?: React.ReactNode }>
        return getNodeText(el.props?.children)
      }
      return ""
    }

    // 找到第一个非空文本节点
    let firstIndex = -1
    for (let i = 0; i < nodes.length; i++) {
      const t = getNodeText(nodes[i]).trim()
      if (t.length > 0) { firstIndex = i; break }
    }
    const firstNode = firstIndex >= 0 ? nodes[firstIndex] : null
    const firstText = firstNode ? getNodeText(firstNode).trim() : ""
    const firstLine = firstText.split(/\r?\n/)[0]?.trim() ?? ""
    __mdDebug("firstIndex", firstIndex, "firstLine", firstLine)

    // 兼容：前导空白/中文空格、半角/全角冒号；支持 tip|warning|error|danger（danger=error）
    const m = firstLine.match(/^[\s\u00A0\u3000]*[:：]{2}(tip|warning|error|danger)\b[ \t\u00A0\u3000]*([^\r\n]*)/i)
    const rawType = (m ? (m[1] as string).toLowerCase() : "tip") as "tip" | "warning" | "error" | "danger"
    const type: "tip" | "warning" | "error" = rawType === "danger" ? "error" : rawType
    const title = m && m[2] && (m[2] as string).trim().length > 0
      ? (m[2] as string).trim()
      : (type === "warning" ? "注意" : type === "error" ? "错误" : "提示")

    // 从首个节点中移除“首行”文本，保留其余 Markdown 结构
    const removeFirstLineFromReactNode = (n: React.ReactNode): React.ReactNode => {
      if (typeof n === "string") return n.replace(/^[^\r\n]*\r?\n?/, "")
      if (Array.isArray(n)) return (n as React.ReactNode[]).map(removeFirstLineFromReactNode)
      if (React.isValidElement(n)) {
        const el = n as React.ReactElement<{ children?: React.ReactNode }>
        return React.cloneElement(el, { ...el.props }, removeFirstLineFromReactNode(el.props?.children))
      }
      return n
    }

    const bodyChildren: React.ReactNode[] = m
      ? [
          ...nodes.slice(0, firstIndex),
          firstNode && React.isValidElement(firstNode)
            ? React.cloneElement(
                firstNode as React.ReactElement<{ children?: React.ReactNode }>,
                undefined,
                removeFirstLineFromReactNode((firstNode as React.ReactElement<{ children?: React.ReactNode }>).props?.children)
              )
            : (typeof firstNode === "string" ? removeFirstLineFromReactNode(firstNode) : firstNode),
          ...nodes.slice(firstIndex + 1),
        ].filter(Boolean) as React.ReactNode[]
      : (nodes as React.ReactNode[])

    __mdDebug("match", m, "type", type, "title", title, "bodyLen", bodyChildren.length)

    const clsByType = {
      tip: {
        box: "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800",
        title: "text-blue-700 dark:text-blue-400",
        text: "text-blue-600 dark:text-blue-500",
        icon: <Info className="w-4 h-4 text-blue-500 mt-0.5" />,
      },
      warning: {
        box: "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800",
        title: "text-amber-700 dark:text-amber-400",
        text: "text-amber-600 dark:text-amber-500",
        icon: <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />,
      },
      error: {
        box: "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800",
        title: "text-red-700 dark:text-red-400",
        text: "text-red-600 dark:text-red-500",
        icon: <AlertOctagon className="w-4 h-4 text-red-500 mt-0.5" />,
      },
    } as const

    const isDirective = !!m
    const isNested = depth > 0

    // 嵌套且无指令：轻量样式
    const nestedBox = "bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/60 dark:border-blue-800/50"
    const nestedTitle = "text-blue-700/90 dark:text-blue-300/90"
    const nestedText = "text-blue-700/80 dark:text-blue-400/80"

    const cur = isDirective || !isNested
      ? clsByType[type]
      : { box: nestedBox, title: nestedTitle, text: nestedText, icon: <Info className="w-4 h-4 text-blue-500 mt-0.5" /> }

    const containerClasses = cn(
      "my-6 rounded-lg p-3",
      cur.box,
      variant === "article" && "my-8 p-4",
      isNested && "my-4 p-3"
    )

    return (
      <QuoteDepthCtx.Provider value={depth + 1}>
        <blockquote className={containerClasses} {...props}>
          <div className="flex items-start gap-2">
            {cur.icon}
            <div>
              <p className={cn("text-sm font-medium", cur.title)}>{title}</p>
              <div
                className={cn(
                  "mt-1 text-[0.95rem] leading-6",
                  "[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:mt-1",
                  "[&_pre]:my-3 [&_pre]:!text-[13px] [&_code]:!text-[13px]",
                  "[&_table]:my-3 [&_table]:w-full",
                  variant === "article" && "text-[1rem] leading-7",
                  cur.text
                )}
              >
                {bodyChildren.length > 0 ? bodyChildren : null}
              </div>
            </div>
          </div>
        </blockquote>
      </QuoteDepthCtx.Provider>
    )
  }
  return Blockquote
}

export interface MarkdownProps {
  children: string
  className?: string
  variant?: "default" | "compact" | "article" | "card"
  showToc?: boolean
  enableMath?: boolean
  enableGfm?: boolean
  enableRaw?: boolean
  allowDangerousHtml?: boolean
  components?: Partial<Components>
  remarkPlugins?: Pluggable[]
  rehypePlugins?: Pluggable[]
}

// 代码复制功能组件 - 修复嵌套问题
const CodeBlock = ({ 
  children, 
  className, 
  inline, 
  ...props 
}: {children: React.ReactNode, className?: string, inline?: boolean}) => {
  const { theme } = useTheme()
  const [copied, setCopied] = React.useState(false)
  
  const match = /language-(\w+)/.exec(className || "")
  const language = match ? match[1] : ""
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (inline) {
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        {...props}
      >
        {children}
      </code>
    )
  }

  const codeString = String(children).replace(/\n$/, "")

  return (
    <div className="relative group not-prose">
      <div className="absolute right-2 top-2 z-10">
        {language && (
          <Badge variant="secondary" className="mr-2 text-xs">
            {language}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => copyToClipboard(codeString)}
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        style={(theme === "dark" ? oneDark : oneLight) as Record<string, React.CSSProperties>}
        language={language}
        PreTag="div"
        className="rounded-lg"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  )
}

// 默认组件映射
const createDefaultComponents = (variant: MarkdownProps["variant"]): Partial<Components> => ({
  // 标题组件
  h1: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const slugify = (t: string) => t.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    const text = typeof children === 'string' ? children : ''
    const computedId = text ? slugify(text) : ''
    const finalId = computedId || id
    return (
      <h1
        id={finalId}
        className={cn(
          "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
          variant === "compact" && "text-3xl lg:text-4xl",
          variant === "article" && "border-b pb-4 mb-6"
        )}
        {...props}
      >
        {children}
      </h1>
    )
  },
  h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const slugify = (t: string) => t.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    const text = typeof children === 'string' ? children : ''
    const computedId = text ? slugify(text) : ''
    const finalId = computedId || id
    return (
      <h2
        id={finalId}
        className={cn(
          "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
          variant === "compact" && "text-2xl pb-1",
          variant === "article" && "mt-12 mb-6"
        )}
        {...props}
      >
        {children}
      </h2>
    )
  },
  h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const slugify = (t: string) => t.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    const text = typeof children === 'string' ? children : ''
    const computedId = text ? slugify(text) : ''
    const finalId = computedId || id
    return (
      <h3
        id={finalId}
        className={cn(
          "scroll-m-20 text-2xl font-semibold tracking-tight",
          variant === "compact" && "text-xl",
          variant === "article" && "mt-8 mb-4"
        )}
        {...props}
      >
        {children}
      </h3>
    )
  },
  h4: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const slugify = (t: string) => t.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    const text = typeof children === 'string' ? children : ''
    const computedId = text ? slugify(text) : ''
    const finalId = computedId || id
    return (
      <h4
        id={finalId}
        className={cn(
          "scroll-m-20 text-xl font-semibold tracking-tight",
          variant === "compact" && "text-lg",
          variant === "article" && "mt-6 mb-3"
        )}
        {...props}
      >
        {children}
      </h4>
    )
  },
  h5: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const slugify = (t: string) => t.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    const text = typeof children === 'string' ? children : ''
    const computedId = text ? slugify(text) : ''
    const finalId = computedId || id
    return (
      <h5
        id={finalId}
        className={cn(
          "scroll-m-20 text-lg font-semibold tracking-tight",
          variant === "compact" && "text-base",
          variant === "article" && "mt-4 mb-2"
        )}
        {...props}
      >
        {children}
      </h5>
    )
  },
  h6: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const slugify = (t: string) => t.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    const text = typeof children === 'string' ? children : ''
    const computedId = text ? slugify(text) : ''
    const finalId = computedId || id
    return (
      <h6
        id={finalId}
        className={cn(
          "scroll-m-20 text-base font-semibold tracking-tight",
          variant === "compact" && "text-sm",
          variant === "article" && "mt-4 mb-2"
        )}
        {...props}
      >
        {children}
      </h6>
    )
  },

  // 段落和文本
  p: ({ children, ...props }) => (
    <p
      className={cn(
        "leading-7 [&:not(:first-child)]:mt-6",
        variant === "compact" && "[&:not(:first-child)]:mt-4 text-sm leading-6",
        variant === "article" && "text-lg leading-8 mb-4"
      )}
      {...props}
    >
      {children}
    </p>
  ),

  // 链接
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
      {href?.startsWith("http") && <ExternalLink className="h-3 w-3" />}
    </a>
  ),

  // 列表
  ul: ({ children, ...props }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),

  // 引用块（支持 ::tip | ::warning | ::error | ::danger，默认 tip；嵌套无指令时使用轻量样式）
  blockquote: createBlockquote(variant),

  // 代码 - 分离行内和块级处理
  code: ({ children, className, inline }: {children?: React.ReactNode, className?: string, inline?: boolean}) => {
    // 某些情况下 inline 可能为 undefined，这里用 className 是否包含 language- 来辅助判断
    const isInline = inline === true || !className || !/\blanguage-/.test(className)

    if (isInline) {
      return (
        <code
          className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        >
          {children}
        </code>
      )
    }
    // 非行内代码块：渲染一个 code 元素，供 pre 包裹并提取信息
    return (
      <code className={className}>
        {children}
      </code>
    )
  },
  // 专门处理代码块 - 确保不在 p 标签内
  pre: ({ children, ...props }: {children?: React.ReactNode}) => {
    // 检查 children 是否是 code 元素
    const childArray = React.Children.toArray(children)
    const codeElement = childArray[0] as React.ReactElement<{ className?: string; children?: React.ReactNode }>

    const className = (codeElement && codeElement.props) ? (codeElement.props.className || '') : ''
    const rawCodeChildren = (codeElement && codeElement.props && typeof codeElement.props.children !== 'undefined')
      ? codeElement.props.children
      : children
    const codeString = String(rawCodeChildren || '').replace(/\n$/, "")
    
    // 检查是否是 Mermaid 图表
    if (className.includes('language-mermaid')) {
      return (
        <div className="my-6" {...props}>
          <MermaidCodeBlock>{codeString}</MermaidCodeBlock>
        </div>
      )
    }
    
    return (
      <div className="my-6" {...props}>
        <CodeBlock className={className} inline={false}>
          {codeString}
        </CodeBlock>
      </div>
    )
  },

  // 水平分割线
  hr: ({ ...props }) => <Separator className="my-8" {...props} />,

  // 表格
  table: ({ children, ...props }) => (
    <div className="my-8 w-full overflow-x-auto">
      <div className="rounded-lg border border-border/50 shadow-sm overflow-hidden bg-card">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className={cn(
      "bg-gradient-to-r from-muted/80 to-muted/60",
      "border-b border-border/60"
    )} {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border/40" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className={cn(
      "transition-all duration-200 ease-in-out",
      "hover:bg-muted/20 hover:shadow-sm",
      "group"
    )} {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className={cn(
        "px-6 py-4 text-left font-semibold text-foreground/90",
        "text-sm tracking-wide uppercase",
        "[&[align=center]]:text-center [&[align=right]]:text-right",
        "first:pl-6 last:pr-6"
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className={cn(
        "px-6 py-4 text-sm text-foreground/80",
        "[&[align=center]]:text-center [&[align=right]]:text-right",
        "first:pl-6 last:pr-6",
        "group-hover:text-foreground transition-colors duration-200"
      )}
      {...props}
    >
      {children}
    </td>
  ),

  // 图片 - 支持大图查看
  img: ({ src, alt, title, ...props }) => {
    if (!src || typeof src !== 'string') return null
    return (
      <MarkdownImage
        src={src}
        alt={alt}
        title={title}
        {...props}
      />
    )
  },

  // 强调
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // 删除线 (需要 remark-gfm)
  del: ({ children, ...props }) => (
    <del className="line-through opacity-75" {...props}>
      {children}
    </del>
  ),

  // 高亮文本 (mark元素)
  mark: ({ children, ...props }) => (
    <mark className={cn(
      "bg-yellow-200 dark:bg-yellow-900/30 px-1 py-0.5 rounded-sm",
      "text-foreground font-medium",
      variant === "compact" && "px-0.5 py-0.25 text-sm",
      variant === "article" && "px-1.5 py-1"
    )} {...props}>
      {children}
    </mark>
  ),
  // 键盘按键
  kbd: ({ children, ...props }) => (
    <kbd
      className={cn(
        "inline-flex items-center justify-center align-baseline",
        "rounded-md border border-border/60",
        "bg-muted text-foreground/90",
        "shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)]",
        "mx-0.5 px-1.5 py-0.5 font-mono text-[12px] leading-none",
        variant === "compact" && "text-[11px] px-1 py-0.5",
        variant === "article" && "text-[13px] px-2 py-1"
      )}
      {...props}
    >
      {children}
    </kbd>
  ),
})

export function Markdown({
  children,
  className,
  variant = "default",
  showToc = false,
  enableMath = true,
  enableGfm = true,
  enableRaw = false,
  allowDangerousHtml = false,
  components: customComponents,
  remarkPlugins: customRemarkPlugins = [],
  rehypePlugins: customRehypePlugins = [],
}: MarkdownProps) {
  // 预处理文本，将 ==text== 语法转换为 <mark> 标签
  const preprocessedContent = React.useMemo(() => {
    const stripped = stripFrontmatter(children)
    // 文本高亮 ==text==
    let s = stripped.replace(/==(.*?)==/g, '<mark>$1</mark>')
    // 指令块 ::tip/::warning/::error/::danger 转为引用块，复用 blockquote 卡片渲染
    s = transformAdmonitionsToBlockquote(s)
    return s
  }, [children])
  // 构建插件数组
  const remarkPlugins = React.useMemo(() => {
    const plugins = [...customRemarkPlugins]
    
    if (enableGfm) plugins.push(remarkGfm)
    if (enableMath) plugins.push(remarkMath)
    if (showToc) plugins.push([remarkToc, { heading: "目录|table of contents" }])
    
    return plugins
  }, [enableGfm, enableMath, showToc, customRemarkPlugins])

  const rehypePlugins = React.useMemo(() => {
    const plugins = [...customRehypePlugins]
    
    plugins.push(rehypeSlug)
    if (enableMath) plugins.push(rehypeKatex)
    // 始终启用 rehypeRaw 以支持 mark 标签
    plugins.push(rehypeRaw)
    
    return plugins
  }, [enableMath, enableRaw, allowDangerousHtml, customRehypePlugins])

  // 合并组件
  const components = React.useMemo(() => ({
    ...createDefaultComponents(variant),
    ...customComponents,
  }), [variant, customComponents])

  const content = (
    <div className={cn(
      "prose prose-neutral dark:prose-invert max-w-none",
      variant === "compact" && "prose-sm",
      variant === "article" && "prose-lg prose-headings:font-bold",
      className
    )}>
      <QuoteDepthCtx.Provider value={0}>
        <ReactMarkdown
          components={components}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          skipHtml={false}
        >
          {preprocessedContent}
        </ReactMarkdown>
      </QuoteDepthCtx.Provider>
    </div>
  )

  if (variant === "card") {
    return (
      <Card className="p-6">
        {content}
      </Card>
    )
  }

  return content
}

export { type Components as MarkdownComponents }
