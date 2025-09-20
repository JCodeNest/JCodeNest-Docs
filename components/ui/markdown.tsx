"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MarkdownImage } from "@/components/ui/image-preview"
import { MermaidCodeBlock } from "@/components/ui/mermaid"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Check, Copy, ExternalLink } from "lucide-react"
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

// KaTeX CSS import
import "katex/dist/katex.min.css"

// 去除 Markdown 文首 YAML Frontmatter（--- 开头和结尾的元信息块）
function stripFrontmatter(text: string): string {
  // 仅在文件开头匹配，以免误伤正文中的 --- 分隔线
  const frontmatterPattern = /^---\n[\s\S]*?\n---\n?/
  return text.replace(frontmatterPattern, "")
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
  h1: ({ children, ...props }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
      : ''
    return (
      <h1
        id={id}
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
  h2: ({ children, ...props }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
      : ''
    return (
      <h2
        id={id}
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
  h3: ({ children, ...props }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
      : ''
    return (
      <h3
        id={id}
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
  h4: ({ children, ...props }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
      : ''
    return (
      <h4
        id={id}
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
  h5: ({ children, ...props }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
      : ''
    return (
      <h5
        id={id}
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
  h6: ({ children, ...props }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
      : ''
    return (
      <h6
        id={id}
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

  // 引用块
  blockquote: ({ children, ...props }) => (
    <blockquote
      className={cn(
        // 基础样式：与HTML块保持一致的设计
        "my-6 rounded-lg",
        // 背景色：模拟 #f0f8ff 的浅蓝色背景
        "bg-blue-50 dark:bg-blue-950/30",
        // 内边距：使用 1rem 等效的 Tailwind 类
        "px-4 py-4",
        // 字体样式：保持斜体但增强可读性
        "italic text-foreground",
        // 阴影效果增强视觉层次
        "shadow-sm",
        // 内部元素间距控制
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        // 嵌套引用块样式
        "[&_blockquote]:my-4 [&_blockquote]:ml-4 [&_blockquote]:border-l-2",
        "[&_blockquote]:bg-blue-100/50 dark:[&_blockquote]:bg-blue-900/20 [&_blockquote]:px-4 [&_blockquote]:py-3",
        // 内部段落间距优化
        "[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        // 内部列表间距优化
        "[&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1",
        // 内部代码块间距优化
        "[&_pre]:my-4 [&_code]:bg-blue-100 dark:[&_code]:bg-blue-900/40",
        // 内部表格间距优化
        "[&_table]:my-4",
        // 响应式调整
        variant === "compact" && "my-4 px-3 py-3 text-sm [&_p]:my-2",
        variant === "article" && "my-8 px-6 py-5 text-lg [&_p]:my-4"
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),

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
    return stripped.replace(/==(.*?)==/g, '<mark>$1</mark>')
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
      <ReactMarkdown
        components={components}
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        skipHtml={false}
      >
        {preprocessedContent}
      </ReactMarkdown>
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
