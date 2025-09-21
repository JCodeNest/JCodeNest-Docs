"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Calculator,
    FileJson,
    Globe,
    Hash,
    Image,
    Palette,
    QrCode,
    Settings,
    PlayCircle,
    PencilRuler,
    Regex,
    Signature,
    Image as ImageIcon,
    Sigma,
    Clock3,
    ScanText,
    ListOrdered
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
    id: "site-nav",
    name: "站点导航",
    description: "常用站点导航与搜索入口",
    icon: Globe,
    color: "text-yellow-500",
    available: true
  },
  {
    id: "video-learning",
    name: "视频学习",
    description: "视频资源与检索",
    icon: PlayCircle,
    color: "text-red-500",
    available: true
  },
  {
    id: "excalidraw",
    name: "白板作图",
    description: "手绘风白板（导出 PNG/SVG/工程）",
    icon: PencilRuler,
    color: "text-emerald-500",
    available: true
  },
  {
    id: "signature-designer",
    name: "电子签名",
    description: "在线手写签名（导出 PNG/SVG）",
    icon: Signature,
    color: "text-teal-500",
    available: true
  },
  {
    id: "image-base64",
    name: "图片Base64",
    description: "上传图片生成 Data URI / CSS / HTML",
    icon: ImageIcon,
    color: "text-rose-500",
    available: true
  },
  {
    id: "regex-tester",
    name: "正则工具",
    description: "测试/生成/速查常见正则表达式",
    icon: Regex,
    color: "text-purple-500",
    available: true
  },
  {
    id: "base-converter",
    name: "进制转换",
    description: "2–36 进制转换与格式化",
    icon: Sigma,
    color: "text-sky-500",
    available: true
  },
  {
    id: "timestamp-converter",
    name: "时间戳转换",
    description: "实时时间戳与日期互转，秒/毫秒与时区切换",
    icon: Clock3,
    color: "text-amber-600",
    available: true
  },
  {
    id: "image-compressor",
    name: "图片压缩",
    description: "浏览器端高质量图片压缩：多图/格式/质量/尺寸",
    icon: ImageIcon,
    color: "text-cyan-700",
    available: true
  },
  {
    id: "ocr-recognizer",
    name: "图片文字识别",
    description: "Tesseract.js 前端离线 OCR（中文/英文、预处理、并发）",
    icon: ScanText,
    color: "text-lime-600",
    available: true
  },
  {
    id: "http-status-codes",
    name: "HTTP 状态码",
    description: "最新状态码·检索与分类展示",
    icon: ListOrdered,
    color: "text-blue-700",
    available: true
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
        case "site-nav":
          router.push("/tools/site-nav")
          break
        case "video-learning":
          router.push("/tools/video-learning")
          break
        case "excalidraw":
          router.push("/tools/excalidraw")
          break
        case "signature-designer":
          router.push("/tools/signature")
          break
        case "image-base64":
          router.push("/tools/image-base64")
          break
        case "regex-tester":
          router.push("/tools/regex-tester")
          break
        case "base-converter":
          router.push("/tools/base-converter")
          break
        case "timestamp-converter":
          router.push("/tools/timestamp-converter")
          break
        case "image-compressor":
          router.push("/tools/image-compressor")
          break
        case "ocr-recognizer":
          router.push("/tools/ocr-recognizer")
          break
        case "http-status-codes":
          router.push("/tools/http-status-codes")
          break
        default:
          console.log(`Navigate to ${tool.id}`)
      }
    }
  }

  return (
    <>
      <div className="w-full h-full overflow-y-auto">
        <div className="grid grid-cols-4 grid-rows-2 gap-3">
          {appTools.map((tool) => {
            const IconComponent = tool.icon
            return (
              <Card 
                key={tool.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-md border-border/50 bg-background/50 backdrop-blur-sm relative overflow-hidden"
                onClick={() => handleToolClick(tool)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full text-center space-y-2">
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