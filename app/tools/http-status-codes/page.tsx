import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import HttpStatusCodes from "@/components/http-status-codes"
import { ListOrdered } from "lucide-react"

export const metadata = {
  title: "HTTP 状态码 - 工具箱",
  description: "最新 HTTP 状态码查询与分类展示，支持检索与快速复制"
}

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <a href="/docs">JCodeNest 文档</a>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <a href="/tools">工具箱</a>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>HTTP 状态码</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <ListOrdered className="w-4 h-4" /> 最新
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <HttpStatusCodes />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}