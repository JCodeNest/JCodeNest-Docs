"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Image as ImageIcon, Upload } from "lucide-react"

function useClipboard(timeout = 1200) {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch {
      // ignore
    }
  }
  return { copied, copy }
}

type FileInfo = {
  name: string
  size: number
  type: string
  width?: number
  height?: number
}

export default function ImageBase64Encoder() {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [dataUrl, setDataUrl] = useState<string>("")
  const [dragOver, setDragOver] = useState(false)
  const { copied, copy } = useClipboard()
  const [alt, setAlt] = useState("image")
  const [tab, setTab] = useState<"datauri" | "css" | "html">("datauri")

  const handleFiles = useCallback((files: FileList | null) => {
    const f = files && files[0]
    if (!f) return
    if (!f.type.startsWith("image/")) {
      alert("请上传图片文件")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || "")
      setDataUrl(url)
      const img = new Image()
      img.onload = () => {
        setFileInfo({
          name: f.name,
          size: f.size,
          type: f.type,
          width: img.width,
          height: img.height,
        })
      }
      img.src = url
    }
    reader.readAsDataURL(f)
  }, [])

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const humanSize = (n?: number) => {
    if (!n && n !== 0) return "-"
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / (1024 * 1024)).toFixed(2)} MB`
  }

  const cssSnippet = dataUrl ? `background-image: url("${dataUrl}");\nbackground-size: contain;\nbackground-repeat: no-repeat;` : ""
  const htmlSnippet =
    dataUrl
      ? `<img src="${dataUrl}" alt="${alt}"` +
        (fileInfo?.width ? ` width="${fileInfo.width}"` : "") +
        (fileInfo?.height ? ` height="${fileInfo.height}"` : "") +
        " />"
      : ""

  return (
    <div className="w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            图片 Base64 编码
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 上传区 */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-lg border p-4 ${dragOver ? "border-primary bg-primary/5" : "border-dashed"}`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const el = document.createElement("input")
                    el.type = "file"
                    el.accept = "image/*"
                    el.onchange = (ev: Event) => handleFiles((ev.target as HTMLInputElement).files)
                    el.click()
                  }}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  选择图片
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                支持拖拽到此区域，或点击选择图片（jpg/png/webp/svg/gif等）
              </div>
            </div>
          </div>

          {/* 文件信息与预览 */}
          {dataUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">文件信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground mr-1">文件名:</span>{fileInfo?.name}</div>
                  <div><span className="text-muted-foreground mr-1">类型:</span>{fileInfo?.type}</div>
                  <div><span className="text-muted-foreground mr-1">大小:</span>{humanSize(fileInfo?.size)}</div>
                  <div><span className="text-muted-foreground mr-1">尺寸:</span>{fileInfo?.width} × {fileInfo?.height}</div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="alt" className="text-xs">alt</Label>
                    <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} className="h-8 text-xs" />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">预览</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dataUrl} alt={alt} className="max-h-72 max-w-full w-full object-contain rounded-md border" />
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          {/* 结果片段 */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as "datauri" | "css" | "html")}>
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="datauri">Data URI</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="datauri" className="space-y-2 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">data:*/*;base64,...</div>
                <Button size="sm" variant="outline" onClick={() => copy(dataUrl)} disabled={!dataUrl}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  复制
                </Button>
              </div>
              <Textarea rows={6} value={dataUrl} readOnly className="font-mono text-xs h-48 resize-none overflow-auto break-all" />
            </TabsContent>

            <TabsContent value="css" className="space-y-2 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">background-image: url(&quot;data:...&quot;)</div>
                <Button size="sm" variant="outline" onClick={() => copy(cssSnippet)} disabled={!dataUrl}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  复制
                </Button>
              </div>
              <Textarea rows={6} value={cssSnippet} readOnly className="font-mono text-xs h-48 resize-none overflow-auto break-all" />
            </TabsContent>

            <TabsContent value="html" className="space-y-2 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">&lt;img src=&quot;data:...&quot; /&gt;</div>
                <Button size="sm" variant="outline" onClick={() => copy(htmlSnippet)} disabled={!dataUrl}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  复制
                </Button>
              </div>
              <Textarea rows={6} value={htmlSnippet} readOnly className="font-mono text-xs h-48 resize-none overflow-auto break-all" />
            </TabsContent>
          </Tabs>

          {!dataUrl && (
            <div className="text-xs text-muted-foreground">
              选择或拖拽图片后，将自动生成 Data URI / CSS / HTML 片段
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}