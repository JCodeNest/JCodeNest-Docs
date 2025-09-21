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
import { Regex } from "lucide-react"
import RegexTester from "@/components/regex-tester"

export const metadata = {
  title: "正则工具 - JCodeNest",
  description: "自定义正则测试、常见表达式、生成器与速查文档",
}

export default function RegexTesterPage() {
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
                  <BreadcrumbPage>正则工具</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Separator />
        </header>

        <main className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Regex className="w-4 h-4" />
            <span className="text-sm">正则表达式测试 / 生成 / 速查</span>
          </div>
          <RegexTester />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}