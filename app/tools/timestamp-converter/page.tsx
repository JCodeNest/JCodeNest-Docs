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
import { Clock3 } from "lucide-react"
import TimestampConverter from "@/components/timestamp-converter"

export const metadata = {
  title: "时间戳转换 - JCodeNest",
  description: "实时时间戳与相互转换，支持秒/毫秒、UTC/本地切换与复制。",
}

export default function TimestampConverterPage() {
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
                  <BreadcrumbPage>时间戳转换</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Separator />
        </header>

        <main className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Clock3 className="w-4 h-4" />
            <span className="text-sm">时间戳：实时/互转，支持秒/毫秒与 UTC/本地</span>
          </div>
          <TimestampConverter />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}