"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  Github,
  Map,
  MessageSquare,
  PieChart,
  Settings2,
  SquareTerminal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { SearchForm } from "@/components/search-form"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { siteConfig } from "@/config/site"

const iconMap = { Github, MessageSquare }

// 导入内容上下文
const ContentContext = React.createContext<{
  currentPath: string | null
  setCurrentPath: (path: string | null) => void
  content: string
  loading: boolean
  error: string | null
} | null>(null)

export const useContent = () => {
  const context = React.useContext(ContentContext)
  return context
}

// 动态数据将在组件内部获取
const staticData = {
  user: siteConfig.user,
  navSecondary: siteConfig.navSecondary.map((item) => ({
    ...item,
    icon: iconMap[item.icon as keyof typeof iconMap],
  })),
}

type NavNode = {
  title: string
  url: string
  icon: string
  isActive?: boolean
  items?: NavNode[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [navData, setNavData] = React.useState<NavNode[]>([])
  const [loading, setLoading] = React.useState(true)
  const { toggleSidebar, state } = useSidebar()
  
  React.useEffect(() => {
    // 在客户端加载内容目录结构
    const loadContentTree = async () => {
      try {
        // 这里我们需要创建一个 API 路由来获取目录结构
        const response = await fetch('/api/content-tree')
        if (response.ok) {
          const data = await response.json()
          setNavData(data.navMain || [])
        } else {
          // 如果 API 失败，使用默认数据
          setNavData(getDefaultNavData())
        }
      } catch (error) {
        console.error('Failed to load content tree:', error)
        setNavData(getDefaultNavData())
      } finally {
        setLoading(false)
      }
    }
    
    loadContentTree()
  }, [])
  
  return (
    <Sidebar variant="inset" {...props}>
      <div className="flex h-full flex-col rounded-xl border bg-white shadow-sm">
      <SidebarHeader className="px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
              {/* TIP：这里的 bg-white 是侧边栏顶部 logo 的背景色，如果你的 logo 颜色特殊，可以根据需要修改。*/}
                <div className="bg-white text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src={siteConfig.logo.src} 
                    alt="JCodeNest Logo" 
                    width={32} 
                    height={32} 
                    className="size-full object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{siteConfig.name}</span>
                  <span className="truncate text-xs">{siteConfig.subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SearchForm/>
      <SidebarContent className="px-2">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">加载中...</div>
        ) : (
          <NavMain items={navData} />
        )}
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={staticData.user} />
      </SidebarFooter>
      </div>
      <SidebarRail />
      
      {/* 自定义侧边栏切换按钮 - 精致融合设计 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out hidden md:block ${
          state === "expanded" ? "right-0" : "-right-5"
        }`}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          title={state === "expanded" ? "收起侧边栏" : "展开侧边栏"}
          className={`group relative transition-all duration-200 flex items-center justify-center overflow-hidden ${
            state === "expanded" 
              ? "h-10 w-5 bg-white/95 backdrop-blur-sm" 
              : "h-12 w-7 bg-white border border-border/30 shadow-md rounded-r-lg"
          }`}
        >
          {/* 展开状态：极简融合设计 */}
          {state === "expanded" && (
            <>
              {/* 主体形状 - 使用 clip-path 创建完美的融合效果 */}
              <div 
                className="absolute inset-0 bg-white border-r border-border/20"
                style={{
                  clipPath: 'polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%)',
                }}
              />
              {/* 柔和的内阴影效果 */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-gray-50/30 to-transparent opacity-60"
                style={{
                  clipPath: 'polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%)',
                }}
              />
            </>
          )}
          
          {/* 悬停效果 */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            state === "expanded" 
              ? "bg-blue-50/40" 
              : "bg-gray-50/60 rounded-r-lg"
          }`} 
          style={state === "expanded" ? {
            clipPath: 'polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%)',
          } : {}} />
          
          {/* 图标 */}
          <div className="relative z-10 flex items-center justify-center">
            {state === "expanded" ? (
              <ChevronLeft className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
            )}
          </div>
          
          {/* 展开状态的微妙指示器 */}
          {state === "expanded" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-200/60 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          )}
        </button>
      </div>
    </Sidebar>
  )
}

// 默认导航数据的获取函数
function getDefaultNavData(): NavNode[] {
  return [
    {
      title: "博客文档",
      url: "#",
      icon: 'BookOpen',
      isActive: true,
      items: [
        {
          title: "欢迎页面",
          url: "#",
          icon: 'FileText',
        },
        {
          title: "快速开始",
          url: "#",
          icon: 'FileText',
        },
      ],
    },
  ]
}
