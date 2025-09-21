import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import ImageCompressor from "@/components/image-compressor"
import { Badge } from "@/components/ui/badge"
import { ImageDown } from "lucide-react"

export const metadata = {
  title: "图片压缩 - 工具箱",
  description: "浏览器端图片压缩：支持多图、重采样、质量/尺寸设置与 WebP/AVIF/JPEG/PNG 输出"
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
                  <BreadcrumbPage>图片压缩</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <ImageDown className="w-4 h-4" /> <Badge variant="secondary">WebP / AVIF / JPEG / PNG</Badge>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <ImageCompressor />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}