"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Globe, Search, ExternalLink, ChevronDown } from "lucide-react"

type EngineKey = "baidu" | "google" | "bing"

const ENGINES: Record<EngineKey, { name: string; url: (q: string) => string }> = {
  baidu: { name: "百度", url: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}` },
  google: { name: "Google", url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  bing: { name: "Bing", url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
}

type Site = {
  name: string
  url: string
  description?: string
  icon?: string
  overrideName?: string
  overrideDesc?: string
  overrideIcon?: string
}

type Category = {
  id: string
  title: string
  sites: Site[]
}

// 站点元信息缓存，避免重复请求
const metaCache = new Map<string, { title?: string; description?: string; icon?: string }>()

async function fetchSiteMeta(url: string): Promise<{ title?: string; description?: string; icon?: string }> {
  try {
    const res = await fetch(`/api/site-meta?url=${encodeURIComponent(url)}`, { cache: "no-store" })
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

function SiteCard({ site }: { site: Site }) {
  const [meta, setMeta] = React.useState<{ description?: string; icon?: string } | null>(null)

  const needDesc = !site.overrideDesc && !site.description
  const needIcon = !site.overrideIcon && !site.icon

  React.useEffect(() => {
    if (!needDesc && !needIcon) return
    let aborted = false

    const cached = metaCache.get(site.url)
    if (cached && ((needDesc && cached.description) || (needIcon && cached.icon))) {
      setMeta(cached)
      return
    }

    ;(async () => {
      const data = await fetchSiteMeta(site.url)
      if (aborted) return
      const next = {
        description: data.description,
        icon: data.icon,
      }
      metaCache.set(site.url, { ...(cached || {}), ...next })
      setMeta(next)
    })()

    return () => {
      aborted = true
    }
  }, [site.url, needDesc, needIcon])

  const icon = site.overrideIcon || site.icon || meta?.icon
  const name = site.overrideName || site.name
  const desc = site.overrideDesc || site.description || meta?.description

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md border-border/50 bg-background/60 backdrop-blur-sm"
      onClick={() => window.open(site.url, "_blank", "noopener,noreferrer")}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className="shrink-0 size-9 rounded-md bg-muted/60 grid place-items-center overflow-hidden">
          {icon ? (
            <img src={icon} alt="" className="w-full h-full object-cover" />
          ) : (
            <Globe className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <div className="truncate font-medium">{name}</div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/80" />
          </div>
          {desc ? (
            <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
          ) : (
            <div className="text-xs text-muted-foreground/70">{new URL(site.url).hostname}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SiteNavigator() {
  const [engine, setEngine] = React.useState<EngineKey>("baidu")
  const [q, setQ] = React.useState("")
  const [categories] = React.useState<Category[]>([
    // 前端开发
    {
      id: "frontend",
      title: "前端开发",
      sites: [
        { name: "MDN Web Docs", url: "https://developer.mozilla.org", description: "权威前端与Web API文档" },
        { name: "TypeScript", url: "https://www.typescriptlang.org", description: "TypeScript 官方文档与工具", icon: "https://www.typescriptlang.org/favicon-32x32.png" },
        { name: "React", url: "https://react.dev", description: "React 官方文档", icon: "https://react.dev/favicon-32x32.png" },
        { name: "Vue.js", url: "https://vuejs.org", description: "Vue 官方文档", icon: "https://vuejs.org/logo.svg" },
        { name: "Next.js", url: "https://nextjs.org", description: "Next.js 官方文档", icon: "https://nextjs.org/favicon.ico" },
        { name: "Vite", url: "https://vitejs.dev", description: "前端构建工具 Vite", icon: "https://vitejs.dev/logo.svg" },
        { name: "npm", url: "https://www.npmjs.com", description: "JavaScript 包管理与检索" },
        { name: "unpkg", url: "https://unpkg.com", description: "CDN 直接加载 npm 包" },
        { name: "jsDelivr", url: "https://www.jsdelivr.com", description: "开源 CDN", icon: "https://www.jsdelivr.com/favicon.ico" },
        { name: "Tailwind CSS", url: "https://tailwindcss.com", description: "实用类优先的 CSS 框架" },
        { name: "shadcn/ui", url: "https://ui.shadcn.com", description: "基于 Radix 的组件集合", icon: "https://ui.shadcn.com/favicon.ico" },
        { name: "Can I use", url: "https://caniuse.com", description: "浏览器兼容性查询", icon: "https://caniuse.com/img/favicon-128.png" },
        { name: "ESLint", url: "https://eslint.org", description: "JS/TS 代码质量工具", icon: "https://eslint.org/favicon.ico" },
      ],
    },

    // 后端开发
    {
      id: "backend",
      title: "后端开发",
      sites: [
        { name: "Spring", url: "https://spring.io/", description: "Spring 官方项目", icon: "https://spring.io/favicon-32x32.png?v=96334d577af708644f6f0495dd1c7bc8" },
        { name: "Spring Boot", url: "https://spring.io/projects/spring-boot", description: "Spring Boot 官方", icon: "https://spring.io/favicon-32x32.png?v=96334d577af708644f6f0495dd1c7bc8" },
        { name: "Maven Central", url: "https://central.sonatype.com", description: "Maven 中央仓库检索", icon: "https://central.sonatype.com/favicon.ico" },
        { name: "OpenJDK Docs", url: "https://docs.oracle.com/javase/8/docs/api/", description: "Java 标准库文档（JDK8）" },
        { name: "PostgreSQL", url: "https://www.postgresql.org/docs/", description: "PostgreSQL 官方文档", icon: "https://www.postgresql.org/favicon.ico" },
        { name: "MySQL", url: "https://dev.mysql.com/doc/", description: "MySQL 官方文档", icon: "https://www.mysql.com/common/logos/logo-mysql-170x115.png" },
        { name: "Redis", url: "https://redis.io/docs/latest/", description: "Redis 官方文档"},
        { name: "Nginx", url: "https://nginx.org/en/docs/", description: "Nginx 官方文档", icon: "https://nginx.org/favicon.ico" },
        { name: "Docker Docs", url: "https://docs.docker.com", description: "Docker 官方文档", icon: "https://www.docker.com/wp-content/uploads/2023/04/cropped-Docker-favicon-32x32.png" },
        { name: "Kubernetes", url: "https://kubernetes.io/docs/home/", description: "K8s 官方文档", icon: "https://kubernetes.io/icons/favicon-64.png" },
        { name: "Node.js Docs", url: "https://nodejs.org/docs/latest/api/", description: "Node.js 官方文档" },
        { name: "Go Docs", url: "https://go.dev/doc", description: "Go 官方文档", icon: "https://go.dev/blog/go-brand/Go-Logo/PNG/Go-Logo_Aqua.png" },
        { name: "Python Docs", url: "https://docs.python.org/3/", description: "Python 官方文档", icon: "https://www.python.org/static/favicon.ico" },
      ],
    },

    // 设计资源
    {
      id: "design",
      title: "设计资源",
      sites: [
        { name: "Figma", url: "https://www.figma.com", description: "协作式界面设计工具", icon: "https://static.figma.com/app/icon/1/favicon.png" },
        { name: "Dribbble", url: "https://dribbble.com", description: "设计灵感与作品社区" },
        { name: "Behance", url: "https://www.behance.net", description: "设计与创意作品平台" },
        { name: "Font Awesome", url: "https://fontawesome.com", description: "图标库", icon: "https://fontawesome.com/favicon.ico" },
        { name: "Heroicons", url: "https://heroicons.com", description: "Tailwind 团队开源图标", icon: "https://heroicons.com/favicon.ico" },
        { name: "Iconify", url: "https://iconify.design", description: "海量图标集合" },
        { name: "Google Fonts", url: "https://fonts.google.com", description: "免费字体库" },
        { name: "Color Hunt", url: "https://colorhunt.co", description: "配色灵感" },
        { name: "LottieFiles", url: "https://lottiefiles.com", description: "Lottie 动画资源" },
        { name: "Phosphor Icons", url: "https://phosphoricons.com", description: "可变重 Icon 套件" },
      ],
    },

    // 文档与检索
    {
      id: "docs",
      title: "文档与检索",
      sites: [
        { name: "GitHub", url: "https://github.com", description: "全球最大的开源托管平台", icon: "https://github.githubassets.com/favicons/favicon.svg" },
        { name: "Stack Overflow", url: "https://stackoverflow.com", description: "程序员问答社区", icon: "https://stackoverflow.design/assets/img/favicons/favicon.ico" },
        { name: "DevDocs", url: "https://devdocs.io", description: "多语言 API 文档聚合", icon: "https://devdocs.io/images/icon-32.png" },
        { name: "awesome-xxx", url: "https://github.com/sindresorhus/awesome", description: "各领域优秀资源合集", icon: "https://github.githubassets.com/favicons/favicon.svg" },
      ],
    },

    // 常用工具
    {
      id: "tools",
      title: "常用工具",
      sites: [
        { name: "Regex101", url: "https://regex101.com", description: "正则表达式测试" },
        { name: "Crontab Guru", url: "https://crontab.guru", description: "Cron 表达式向导" },
        { name: "JSON Schema", url: "https://jsonschema.net", description: "JSON Schema 设计" },
        { name: "JWT.io", url: "https://jwt.io", description: "JWT 解码与验证" },
        { name: "Asciinema", url: "https://asciinema.org", description: "终端录屏与分享" },
      ],
    },
    {
      id: "coding-platforms",
      title: "编程平台",
      sites: [
        { name: "力扣 LeetCode", url: "https://leetcode.cn", description: "国内版刷题平台" },
        { name: "牛客网", url: "https://www.nowcoder.com", description: "笔试面试/刷题/求职社区" },
        { name: "Codeforces", url: "https://codeforces.com", description: "竞赛与题库平台" },
        { name: "AtCoder", url: "https://atcoder.jp", description: "日本程序竞赛平台" }
      ]
    },
    {
      id: "cn-tech",
      title: "中文技术社区",
      sites: [
        { name: "CSDN", url: "https://www.csdn.net", description: "中文技术社区与博客" },
        { name: "掘金", url: "https://juejin.cn", description: "高质量技术内容社区" },
        { name: "开源中国", url: "https://www.oschina.net", description: "中文开源技术社区" },
        { name: "V2EX", url: "https://www.v2ex.com", description: "创意工作者社区" },
        { name: "极客时间", url: "https://time.geekbang.org", description: "付费技术专栏与课程" }
      ]
    },
    {
      id: "ai",
      title: "AI 工具",
      sites: [
        { name: "ChatGPT", url: "https://chat.openai.com", description: "OpenAI 聊天与助手" },
        { name: "DeepSeek", url: "https://www.deepseek.com", description: "国产大模型与应用" },
        { name: "Claude", url: "https://claude.ai", description: "Anthropic 办公与问答助手" },
        { name: "Google AI Studio", url: "https://aistudio.google.com", description: "Google AI 应用开发平台" },
        { name: "Grok (xAI)", url: "https://grok.x.ai", description: "xAI 模型与产品" }
      ]
    },
    {
      id: "ui-libraries",
      title: "前端 UI 库",
      sites: [
        { name: "Ant Design", url: "https://ant.design", description: "企业级设计体系与 React 组件库" },
        { name: "Element Plus", url: "https://element-plus.org", description: "为 Vue 3 打造的桌面端组件库" },
        { name: "MUI", url: "https://mui.com", description: "Material Design React 组件库" },
        { name: "Arco Design", url: "https://arco.design", description: "字节跳动设计体系与组件库" },
        { name: "Naive UI", url: "https://www.naiveui.com", description: "一个 Vue 3 组件库" },
        { name: "Radix UI", url: "https://www.radix-ui.com", description: "无样式可访问的基础组件" }
      ]
    },
    {
      id: "icons",
      title: "图标与字体",
      sites: [
        { name: "Iconfont", url: "https://www.iconfont.cn", description: "阿里矢量图标库" },
        { name: "Remix Icon", url: "https://remixicon.com", description: "开源中性风格图标集" },
        { name: "Material Icons", url: "https://fonts.google.com/icons", description: "Google 材质设计图标库" }
      ]
    },
    {
      id: "diagram",
      title: "在线画图",
      sites: [
        { name: "Excalidraw", url: "https://excalidraw.com", description: "手绘风在线白板" },
        { name: "diagrams.net", url: "https://app.diagrams.net", description: "流程图/架构图" },
        { name: "Mermaid Live", url: "https://mermaid.live", description: "基于文本的图表渲染" }
      ]
    },
    {
      id: "search-observability",
      title: "搜索/日志/可观测",
      sites: [
        { name: "Elastic", url: "https://www.elastic.co", description: "Elasticsearch/Kibana 官方" },
        { name: "Elasticsearch Docs", url: "https://www.elastic.co/guide", description: "Elasticsearch 官方文档" }
      ]
    },
    {
      id: "email-media",
      title: "邮箱与媒体",
      sites: [
        { name: "Gmail", url: "https://mail.google.com", description: "Google 邮箱" },
        { name: "Outlook", url: "https://outlook.live.com", description: "微软邮箱服务" },
        { name: "QQ 邮箱", url: "https://mail.qq.com", description: "腾讯邮箱" },
        { name: "163 邮箱", url: "https://mail.163.com", description: "网易邮箱" },
        { name: "YouTube", url: "https://www.youtube.com", description: "全球视频平台" },
        { name: "Bilibili", url: "https://www.bilibili.com", description: "中文视频社区" }
      ]
    },
  ])

  const [activeTab, setActiveTab] = React.useState(categories[0]?.id ?? "")

  // 当前分类
  const currentCategory = React.useMemo(() => {
    return categories.find(c => c.id === activeTab) || categories[0]
  }, [categories, activeTab])

  // 针对当前分类的过滤
  const filteredSites = React.useMemo(() => {
    if (!q.trim()) return currentCategory?.sites ?? []
    const lower = q.toLowerCase()
    return (currentCategory?.sites ?? []).filter(s =>
      (s.overrideName || s.name).toLowerCase().includes(lower) ||
      (s.overrideDesc || s.description || "").toLowerCase().includes(lower) ||
      s.url.toLowerCase().includes(lower)
    )
  }, [q, currentCategory])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    const url = ENGINES[engine].url(q.trim())
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-4">
      {/* 顶部搜索区 */}
      <div className="rounded-xl border bg-background/60 backdrop-blur-sm p-4 md:p-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-10 gap-1 w-full sm:w-auto">
                <Globe className="w-4 h-4" />
                {ENGINES[engine].name}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32 p-1">
              {(Object.keys(ENGINES) as EngineKey[]).map((k) => (
                <DropdownMenuItem
                  key={k}
                  onClick={() => setEngine(k)}
                  className={engine === k ? "text-primary" : ""}
                >
                  {ENGINES[k].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex-1">
            <Search className="absolute left-2 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索当前分类站点，或直接回车检索（百度 / Google / Bing）"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-10 w-full"
            />
          </div>

          <Button type="submit" className="h-10 w-full sm:w-auto">搜索</Button>
        </form>
      </div>

      {/* 分类 Tabs + 网格卡片 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-nowrap md:flex-wrap gap-1 p-1 overflow-x-auto md:overflow-visible -mx-1 px-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="shrink-0">{cat.title}</TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="space-y-3">
            {activeTab === cat.id && (
              filteredSites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredSites.map((s, idx) => (
                    <SiteCard key={s.url + idx} site={s} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground px-1 py-8 text-center">暂无匹配站点</div>
              )
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}