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
import { Image as ImageIcon } from "lucide-react"
import ImageBase64Encoder from "@/components/image-base64-encoder"

export const metadata = {
  title: "图片Base64 - JCodeNest",
  description: "上传图片自动生成 Data URI、CSS 与 HTML 片段",
}

export default function ImageBase64Page() {
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
                  <BreadcrumbPage>图片Base64</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Separator />
        </header>

        <main className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">图片Base64编码：Data URI / CSS / HTML</span>
          </div>
          <ImageBase64Encoder />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}