"use client"

import {
    Bell,
    ChevronsUpDown,
    Monitor,
    Moon,
    Palette,
    Sun
} from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: Readonly<{
  user: {
    name: string
    email: string
    avatar: string
  }
}>) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // 确保组件在客户端挂载后才渲染主题相关内容
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
            collisionPadding={12}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isMobile ? (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">主题外观</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setTheme('system')}
                    className="gap-2 py-2.5"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>跟随系统</span>
                    {mounted && theme === 'system' && (
                      <div className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme('light')}
                    className="gap-2 py-2.5"
                  >
                    <Sun className="h-4 w-4" />
                    <span>亮色模式</span>
                    {mounted && theme === 'light' && (
                      <div className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme('dark')}
                    className="gap-2 py-2.5"
                  >
                    <Moon className="h-4 w-4" />
                    <span>暗色模式</span>
                    {mounted && theme === 'dark' && (
                      <div className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <Palette className="h-4 w-4" />
                    <span>主题外观</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className="w-48 max-h-[50vh] overflow-auto"
                    sideOffset={8}
                    collisionPadding={12}
                  >
                    <DropdownMenuItem
                      onClick={() => setTheme('system')}
                      className="gap-2 py-2.5"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>跟随系统</span>
                      {mounted && theme === 'system' && (
                        <div className="ml-auto">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme('light')}
                      className="gap-2 py-2.5"
                    >
                      <Sun className="h-4 w-4" />
                      <span>亮色模式</span>
                      {mounted && theme === 'light' && (
                        <div className="ml-auto">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme('dark')}
                      className="gap-2 py-2.5"
                    >
                      <Moon className="h-4 w-4" />
                      <span>暗色模式</span>
                      {mounted && theme === 'dark' && (
                        <div className="ml-auto">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Bell className="h-4 w-4" />
              <span>站点通知</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
