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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

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

type NavNode = {
  title: string
  url: string
  icon: string
  isActive?: boolean
  items?: NavNode[]
}

export function NavMain({ items }: { items: NavNode[] }) {
  const contentContext = useContent()

  const handleItemClick = (url: string, e: React.MouseEvent) => {
    if (url.startsWith('/docs?path=') && contentContext) {
      e.preventDefault()
      const urlParams = new URLSearchParams(url.split('?')[1])
      const path = urlParams.get('path')
      if (path) contentContext.setCurrentPath(decodeURIComponent(path))
    }
  }

  // 递归渲染
  const RenderItems: React.FC<{ nodes: NavNode[]; nested?: boolean }> = ({ nodes, nested }) => (
    <>
      {nodes.map((node) => {
        const IconComponent = getIconComponent(node.icon)
        const hasChildren = !!(node.items && node.items.length)

        if (!hasChildren) {
          // 叶子节点（文件）
          const Button = nested ? SidebarMenuSubButton : SidebarMenuButton
          const Item = nested ? SidebarMenuSubItem : SidebarMenuItem
          return (
            <Item key={node.title}>
              {nested ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild>
                      <Link href={node.url} onClick={(e) => handleItemClick(node.url, e)}>
                        <span className="truncate">{node.title}</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>{node.title}</TooltipContent>
                </Tooltip>
              ) : (
                <Button asChild tooltip={node.title}>
                  <Link href={node.url} onClick={(e) => handleItemClick(node.url, e)}>
                    {!nested && <IconComponent />}
                    <span>{node.title}</span>
                  </Link>
                </Button>
              )}
            </Item>
          )
        }

        // 目录节点
        const Container = nested ? SidebarMenuSub : SidebarMenu
        return (
          <Collapsible key={node.title} defaultOpen={node.isActive}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={node.title} className="w-full">
                  <IconComponent />
                  <span className="flex-1 text-left">{node.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 data-[state=open]:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <Container>
                  {nested
                    ? <RenderItems nodes={node.items!} nested />
                    : (
                      <SidebarMenuSub>
                        <RenderItems nodes={node.items!} nested />
                      </SidebarMenuSub>
                    )}
                </Container>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )
      })}
    </>
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>技术博客</SidebarGroupLabel>
      <SidebarMenu>
        <RenderItems nodes={items} />
      </SidebarMenu>
    </SidebarGroup>
  )
}
