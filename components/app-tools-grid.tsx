"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Code2, 
  Globe, 
  Calculator, 
  Palette, 
  FileJson, 
  Hash, 
  QrCode, 
  Image,
  Zap,
  Settings
} from "lucide-react"

interface AppTool {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{className?: string}>
  color: string
  available: boolean
}

const appTools: AppTool[] = [
  {
    id: "json-formatter",
    name: "JSON 格式化",
    description: "美化和验证 JSON 数据",
    icon: FileJson,
    color: "text-blue-500",
    available: true
  },
  {
    id: "api-tester",
    name: "API 请求",
    description: "测试和调试 API 接口",
    icon: Globe,
    color: "text-green-500",
    available: true
  },
  {
    id: "calculator",
    name: "计算器",
    description: "程序员专用计算器",
    icon: Calculator,
    color: "text-purple-500",
    available: true
  },
  {
    id: "color-picker",
    name: "颜色选择器",
    description: "颜色代码转换工具",
    icon: Palette,
    color: "text-pink-500",
    available: true
  },
  {
    id: "hash-generator",
    name: "哈希生成",
    description: "MD5、SHA1、SHA256 等",
    icon: Hash,
    color: "text-orange-500",
    available: true
  },
  {
    id: "qr-generator",
    name: "二维码生成",
    description: "快速生成二维码",
    icon: QrCode,
    color: "text-indigo-500",
    available: true
  },
  {
    id: "image-converter",
    name: "图片转换",
    description: "格式转换和压缩",
    icon: Image,
    color: "text-cyan-500",
    available: true
  },
  {
    id: "performance",
    name: "性能测试",
    description: "网站性能分析工具",
    icon: Zap,
    color: "text-yellow-500",
    available: false
  }
]

export function AppToolsGrid() {
  const [selectedTool, setSelectedTool] = useState<AppTool | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handleToolClick = (tool: AppTool) => {
    if (!tool.available) {
      setSelectedTool(tool)
      setIsDialogOpen(true)
    } else {
      // 导航到具体的工具页面
      switch (tool.id) {
        case "json-formatter":
          router.push("/tools/json-formatter")
          break
        case "calculator":
          router.push("/tools/calculator")
          break
        case "color-picker":
          router.push("/tools/color-picker")
          break
        case "qr-generator":
          router.push("/tools/qr-generator")
          break
        case "hash-generator":
          router.push("/tools/hash-generator")
          break
        case "image-converter":
          router.push("/tools/image-converter")
          break
        case "api-tester":
          router.push("/tools/api-tester")
          break
        default:
          console.log(`Navigate to ${tool.id}`)
      }
    }
  }

  return (
    <>
      <div className="w-full h-full overflow-hidden">
        <div className="grid grid-cols-4 grid-rows-2 gap-3 h-full">
          {appTools.map((tool) => {
            const IconComponent = tool.icon
            return (
              <Card 
                key={tool.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-md border-border/50 bg-background/50 backdrop-blur-sm relative overflow-hidden"
                onClick={() => handleToolClick(tool)}
              >
                <CardContent className="p-3 flex flex-col items-center justify-center h-full text-center space-y-2">
                  <div className={`p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors ${tool.color}`}>
                    <IconComponent className="w-6 h-6 sm:w-5 sm:h-5" />
                  </div>
                  <div className="space-y-1 hidden sm:block">
                    <h4 className="text-xs font-medium text-foreground leading-tight">
                      {tool.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                  {!tool.available && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    </div>
                  )}
                  {tool.available && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTool && (
                <>
                  <selectedTool.icon className={`w-5 h-5 ${selectedTool.color}`} />
                  {selectedTool.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              该工具正在开发中，敬请期待！
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                {selectedTool?.description}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                关闭
              </Button>
              <Button disabled>
                <Settings className="w-4 h-4 mr-2" />
                开发中
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}