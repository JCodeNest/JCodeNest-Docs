"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, Star, GitFork, ExternalLink, Sparkles } from "lucide-react"

const STORAGE_KEY = "jcn_promo_last_shown"
const ONE_DAY = 24 * 60 * 60 * 1000

export function GlobalPromoDialog() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    // 仅在浏览器端检查
    try {
      const last = localStorage.getItem(STORAGE_KEY)
      const lastTs = last ? Number(last) : 0
      const now = Date.now()
      if (!last || isNaN(lastTs) || now - lastTs > ONE_DAY) {
        setOpen(true)
      }
    } catch {
      // 忽略存储异常
    }
  }, [])

  const markShown = React.useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {}
  }, [])

  const handleOpenChange = (next: boolean) => {
    if (!next) markShown()
    setOpen(next)
  }

  const goTo = (url: string) => {
    markShown()
    window.open(url, "_blank", "noopener,noreferrer")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <div className="relative">
          {/* 顶部装饰 */}
          <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-primary/20 to-transparent blur-2xl pointer-events-none" />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-2">
            <Badge variant="secondary" className="w-fit">开源 · 可复用</Badge>
            <DialogTitle className="text-2xl mt-2">JCodeNest-Docs 文档博客系统</DialogTitle>
            <DialogDescription className="mt-2">
              一套美观、移动端友好、支持 Markdown/目录/搜索/工具集 的静态博客方案。
              一键 Fork 或 Star，本地运行即可构建属于你的技术文档站点。
            </DialogDescription>
          </DialogHeader>

          {/* 链接区块 */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button className="w-full" onClick={() => goTo("https://github.com/JCodeNest/JCodeNest-Docs/stargazers")}>
              <Star className="w-4 h-4 mr-2" />
              Star
            </Button>
            <Button variant="outline" className="w-full" onClick={() => goTo("https://github.com/JCodeNest/JCodeNest-Docs/fork")}>
              <GitFork className="w-4 h-4 mr-2" />
              Fork
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => goTo("https://github.com/JCodeNest/JCodeNest-Docs")}>
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </div>

          {/* 亮点列表 */}
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 递归内容树 · Frontmatter 处理 · 自定义目录抽屉</li>
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 博客网格 · 搜索接口 · 工具集合（哈希/二维码/图片转换等）</li>
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 移动端优化：目录/返回顶部/卡片布局</li>
          </ul>

          {/* 次要链接 */}
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => goTo("https://github.com/JCodeNest/JCodeNest-Docs#readme")}
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              快速开始文档
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </button>

            <DialogClose asChild>
              <Button variant="ghost" onClick={markShown}>稍后再说</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GlobalPromoDialog