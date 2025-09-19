"use client"

import * as React from "react"
import mermaid from "mermaid"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { MermaidPreview } from "@/components/ui/mermaid-preview"

interface MermaidProps {
  chart: string
  className?: string
}

export function Mermaid({ chart, className }: MermaidProps) {
  const { theme } = useTheme()
  const [svg, setSvg] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
    const renderChart = async () => {
      try {
        // 配置 Mermaid 主题
        mermaid.initialize({
          theme: theme === "dark" ? "dark" : "default",
          startOnLoad: false,
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
          sequence: {
            useMaxWidth: true,
          },
          gantt: {
            useMaxWidth: true,
          },
          journey: {
            useMaxWidth: true,
          },
          timeline: {
            useMaxWidth: true,
          },
          gitGraph: {
            useMaxWidth: true,
          },
          c4: {
            useMaxWidth: true,
          },
        })

        // 生成唯一 ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // 渲染图表
        const { svg: renderedSvg } = await mermaid.render(id, chart)
        setSvg(renderedSvg)
        setError("")
      } catch (err) {
        console.error("Mermaid rendering error:", err)
        console.error("Chart content:", chart)
        
        let errorMessage = "图表渲染失败"
        if (err instanceof Error) {
          // 提取更具体的错误信息
          if (err.message.includes('Lexical error')) {
            errorMessage = `语法错误：${err.message}`
          } else if (err.message.includes('Parse error')) {
            errorMessage = `解析错误：${err.message}`
          } else {
            errorMessage = err.message
          }
        }
        
        setError(errorMessage)
        setSvg("")
      }
    }

    if (chart.trim()) {
      renderChart()
    }
  }, [chart, theme])

  if (error) {
    return (
      <div className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm",
        className
      )}>
        <div className="font-medium text-destructive mb-2 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          Mermaid 图表渲染错误
        </div>
        <div className="text-destructive/80 font-mono text-xs bg-destructive/5 p-2 rounded border">
          {error}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          请检查图表语法是否正确，或参考 
          <a 
            href="https://mermaid.js.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Mermaid 官方文档
          </a>
        </div>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className={cn(
        "rounded-lg border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground",
        className
      )}>
        正在渲染图表...
      </div>
    )
  }

  return (
    <MermaidPreview 
      svg={svg} 
      title={`Mermaid图表`}
      className="my-6"
    >
      <div 
        className={cn(
          "rounded-lg border border-border bg-card p-4 overflow-auto",
          "flex justify-center items-center relative group cursor-pointer",
          "hover:shadow-md transition-shadow",
          className
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </MermaidPreview>
  )
}

// 用于代码块中的 Mermaid 渲染
export function MermaidCodeBlock({ children }: { children: string }) {
  return <Mermaid chart={children} className="my-6" />
}