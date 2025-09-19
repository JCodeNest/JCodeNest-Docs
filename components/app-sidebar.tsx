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
} from "@/components/ui/sidebar"

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
  user: {
    name: "沉默的老李",
    email: "jcodenest@gmail.com",
    avatar: "/avatars/avatar.png",
  },
  navSecondary: [
    {
      title: "Github",
      url: "https://github.com/JCodeNest/JCodeNest-Docs",
      icon: Github,
    },
    {
      title: "反馈",
      url: "https://github.com/JCodeNest/JCodeNest-Docs/issues/new",
      icon: MessageSquare,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [navData, setNavData] = React.useState<Array<{title: string, url: string, icon: string, isActive?: boolean, items?: {title: string, url: string}[]}>>([])
  const [loading, setLoading] = React.useState(true)
  
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
      <SidebarHeader className="border rounded-lg">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src="/avatars/avatar.png" 
                    alt="JCodeNest Logo" 
                    width={32} 
                    height={32} 
                    className="size-full object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">JcodeNest Document</span>
                  <span className="truncate text-xs">A Backend Engineer</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SearchForm/>
      <SidebarContent>
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
    </Sidebar>
  )
}

// 默认导航数据的获取函数
function getDefaultNavData() {
  return [
    {
      title: "博客文档",
      url: "#",
      icon: 'BookOpen', // 使用字符串
      isActive: true,
      items: [
        {
          title: "欢迎页面",
          url: "#",
        },
        {
          title: "快速开始",
          url: "#",
        },
      ],
    },
  ]
}
