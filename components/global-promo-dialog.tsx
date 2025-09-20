"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink, GitFork, Github, Star } from "lucide-react"
import React from "react"

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
            {/* 内容优先 */}
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 你的博客只需关注内容：文件即页面，改动即生效</li>
            {/* 文档树实时处理 */}
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 实时处理文档树：自动递归目录与 Frontmatter，目录/路由联动</li>
            {/* Markdown 渲染 */}
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 极佳的 Markdown 渲染：行内代码、代码块、表格、提示、KaTeX、Mermaid</li>
            {/* 搜索能力 */}
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 内置搜索能力：无需第三方插件，开箱即用</li>
            {/* 工具集 + 移动端 */}
            <li className="flex items-start"><span className="mt-1 mr-2 size-1.5 rounded-full bg-primary" /> 工具集与移动端适配：哈希/二维码/图片转换；目录抽屉/返回顶部/卡片布局</li>
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