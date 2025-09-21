import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Sigma } from "lucide-react"
import BaseConverter from "@/components/base-converter"

export const metadata = {
  title: "进制转换 - JCodeNest",
  description: "支持 2–36 进制，前缀、大小写、分组与小数位控制的强大进制转换工具。",
}

export default function BaseConverterPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background">
          <div className="flex h-12 items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">JCodeNest 文档</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/app/tools">工具箱</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>进制转换</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Separator />
        </header>

        <main className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Sigma className="w-4 h-4" />
            <span className="text-sm">进制转换：2–36，前缀/分组/大小写/小数位</span>
          </div>
          <BaseConverter />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}