"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, BookOpen, FolderOpen, FileText, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// 导入内容上下文
const ContentContext = React.createContext<{
  currentPath: string | null
  setCurrentPath: (path: string | null) => void
  content: string
  loading: boolean
  error: string | null
} | null>(null)

const useContent = () => React.useContext(ContentContext)

// 图标映射表
const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  FolderOpen,
  FileText,
}

// 获取图标组件
function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || FileText // 默认使用 FileText
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: string // 修改为字符串类型
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const contentContext = useContent()
  
  // 处理点击事件
  const handleItemClick = (url: string, e: React.MouseEvent) => {
    // 如果是文档链接且有内容上下文，则使用内容切换
    if (url.startsWith('/docs?path=') && contentContext) {
      e.preventDefault()
      const urlParams = new URLSearchParams(url.split('?')[1])
      const path = urlParams.get('path')
      if (path) {
        contentContext.setCurrentPath(decodeURIComponent(path))
      }
    }
    // 否则使用默认的 Link 组件行为
  }
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>技术博客</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const IconComponent = getIconComponent(item.icon) // 动态获取图标组件
          const hasSubItems = item.items && item.items.length > 0
          
          return (
            <Collapsible key={item.title} defaultOpen={item.isActive}>
              <SidebarMenuItem>
                {hasSubItems ? (
                  // 有子项的目录 - 点击标题可以展开/收缩
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} className="w-full">
                      <IconComponent />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  // 没有子项的目录 - 点击直接跳转
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url} onClick={(e) => handleItemClick(item.url, e)}>
                      <IconComponent />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
                
                {hasSubItems && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url} onClick={(e) => handleItemClick(subItem.url, e)}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
