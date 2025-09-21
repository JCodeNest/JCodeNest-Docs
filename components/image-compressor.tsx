"use client"

import * as React from "react"
import { useCallback, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Check, Download, ImageDown, Image as ImageIcon, Settings2, UploadCloud, Info, Trash2 } from "lucide-react"

type Format = "original" | "jpeg" | "webp" | "avif" | "png"
type Sampling = "auto" | "fast" | "quality"

function useClipboard(timeout = 1200) {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch {
      /* ignore */
    }
  }
  return { copied, copy }
}

function formatBytes(n: number) {
  if (!Number.isFinite(n)) return "-"
  const u = ["B", "KB", "MB", "GB"]
  let i = 0
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 2 : 1)} ${u[i]}`
}

function detectSupport() {
  // 服务器端渲染阶段没有 document，这里直接返回默认值，等到客户端再重新计算
  if (typeof document === "undefined") {
    return { webp: false, avif: false }
  }
  const can = (type: string) => {
    const c = document.createElement("canvas")
    try {
      return c.toDataURL(type).startsWith(`data:${type}`)
    } catch {
      return false
    }
  }
  return {
    webp: can("image/webp"),
    avif: can("image/avif"),
  }
}

type Item = {
  id: string
  file: File
  url: string
  width: number
  height: number
  size: number
  outUrl?: string
  outBlob?: Blob
  outSize?: number
  outWidth?: number
  outHeight?: number
  status: "idle" | "processing" | "done" | "error"
  error?: string
}

export default function ImageCompressor() {
  const { copied, copy } = useClipboard()
  const BATCH_LIMIT = 20
  const [items, setItems] = useState<Item[]>([])
  const [format, setFormat] = useState<Format>("webp")
  const [quality, setQuality] = useState<number>(80) // 0-100
  const [maxW, setMaxW] = useState<number>(1920)
  const [maxH, setMaxH] = useState<number>(1080)
  const [keepAspect, setKeepAspect] = useState<boolean>(true)
  const [noUpscale, setNoUpscale] = useState<boolean>(true)
  const [sampling, setSampling] = useState<Sampling>("auto")
  // 背景填充（透明/白/黑/自定义）
  const [bgMode, setBgMode] = useState<"transparent" | "white" | "black" | "custom">("transparent")
  const [bgColor, setBgColor] = useState<string>("#ffffff")
  const bg = bgMode === "transparent" ? "transparent" : (bgMode === "white" ? "#ffffff" : (bgMode === "black" ? "#000000" : bgColor))

  const [support, setSupport] = useState({ webp: false, avif: false })

  // 客户端探测支持能力
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setSupport(detectSupport())
    }
  }, [])
  // 根据支持情况微调当前格式
  React.useEffect(() => {
    if (format === "webp" && !support.webp) setFormat("jpeg")
    if (format === "avif" && !support.avif) setFormat(support.webp ? "webp" : "jpeg")
  }, [support, format])

  const onFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files)
    const mapped: Item[] = []
    for (const f of arr) {
      if (!f.type.startsWith("image/")) continue
      const url = URL.createObjectURL(f)
      const bmp = await createImageBitmap(f).catch(() => null)
      let width = 0,
        height = 0
      if (bmp) {
        width = bmp.width
        height = bmp.height
        bmp.close()
      }
      mapped.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        url,
        width,
        height,
        size: f.size,
        status: "idle",
      })
    }
    setItems((prev) => [...prev, ...mapped])
  }, [])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFiles(e.target.files)
  }

  const dropRef = useRef<HTMLDivElement | null>(null)
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files) onFiles(e.dataTransfer.files)
    },
    [onFiles]
  )
  const onDrag = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const mimeOf = (fmt: Format, origin: string) => {
    if (fmt === "original") {
      // 原始若是 svg/gif 等不可重编码的，降级为 png
      return origin.startsWith("image/") ? origin : "image/png"
    }
    if (fmt === "jpeg") return "image/jpeg"
    if (fmt === "webp") return "image/webp"
    if (fmt === "avif") return "image/avif"
    if (fmt === "png") return "image/png"
    return "image/png"
  }

  const encode = async (file: File, targetFmt: Format): Promise<{ blob: Blob; width: number; height: number }> => {
    const srcUrl = URL.createObjectURL(file)
    const img = await createImageBitmap(file)
    const originMime = file.type || "image/png"

    let tw = img.width
    let th = img.height
    if (maxW > 0 || maxH > 0) {
      const rw = maxW || img.width
      const rh = maxH || img.height
      if (keepAspect) {
        const scale = Math.min(rw / img.width, rh / img.height)
        if ((noUpscale && scale < 1) || !noUpscale) {
          if (noUpscale) {
            const s = Math.min(1, scale)
            tw = Math.round(img.width * s)
            th = Math.round(img.height * s)
          } else {
            tw = Math.round(img.width * scale)
            th = Math.round(img.height * scale)
          }
        }
      } else {
        tw = rw
        th = rh
      }
    }

    // 目标 mime，考虑支持度回退
    let mime = mimeOf(targetFmt, originMime)
    if (mime === "image/avif" && !support.avif) mime = support.webp ? "image/webp" : "image/jpeg"
    if (mime === "image/webp" && !support.webp) mime = "image/jpeg"

    // 采样：quality 与 fast/quality 影响绘制方式
    const canvas = document.createElement("canvas")
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) throw new Error("Canvas not available")
    ctx.imageSmoothingEnabled = true
    if (sampling === "fast") {
      ctx.imageSmoothingQuality = "low"
    } else if (sampling === "quality") {
      ctx.imageSmoothingQuality = "high"
    } else {
      ctx.imageSmoothingQuality = "medium"
    }

    if (bg !== "transparent") {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, tw, th)
    }
    ctx.drawImage(img, 0, 0, tw, th)
    img.close()
    URL.revokeObjectURL(srcUrl)

    const q = Math.max(0, Math.min(1, quality / 100))
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encode failed"))), mime, mime === "image/png" ? undefined : q)
    })
    return { blob, width: tw, height: th }
  }

  const processOne = async (it: Item, fmt: Format) => {
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "processing", error: undefined } : x)))
    try {
      const { blob, width, height } = await encode(it.file, fmt)
      const outUrl = URL.createObjectURL(blob)
      setItems((prev) =>
        prev.map((x) =>
          x.id === it.id
            ? { ...x, outBlob: blob, outUrl, outSize: blob.size, outWidth: width, outHeight: height, status: "done" }
            : x
        )
      )
    } catch (e: unknown) {
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "error", error: e instanceof Error ? e.message : "压缩失败" } : x)))
    }
  }

  const processBatch = async () => {
    const targets = items.filter(i => !i.outUrl).slice(0, BATCH_LIMIT)
    for (const it of targets) {
      await processOne(it, format)
    }
  }

  const downloadOne = (it: Item) => {
    if (!it.outBlob) return
    const a = document.createElement("a")
    const ext = format === "original" ? it.file.type.split("/")[1] || "png" : format
    a.download = `${it.file.name.replace(/\.[^.]+$/, "")}.${ext}`
    a.href = it.outUrl!
    a.click()
  }

  const downloadAll = () => {
    // 逐个触发下载（无需第三方库）
    for (const it of items) {
      if (it.outUrl) {
        const a = document.createElement("a")
        const ext = format === "original" ? it.file.type.split("/")[1] || "png" : format
        a.download = `${it.file.name.replace(/\.[^.]+$/, "")}.${ext}`
        a.href = it.outUrl
        setTimeout(() => a.click(), 50)
      }
    }
  }

  // 清空列表并释放 URL 资源
  const clearAll = () => {
    try {
      for (const it of items) {
        try { URL.revokeObjectURL(it.url) } catch {}
        if (it.outUrl) {
          try { URL.revokeObjectURL(it.outUrl) } catch {}
        }
      }
    } finally {
      setItems([])
    }
  }

  const { copied: copiedUrl, copy: copyUrl } = useClipboard()
  const pendingCount = useMemo(() => items.filter(i => !i.outUrl && i.status !== "processing").length, [items])
  const nextBatch = Math.min(pendingCount, BATCH_LIMIT)

  return (
    <div className="w-full overflow-x-hidden">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <ImageDown className="w-5 h-5" />
            图片压缩
            <Badge variant="secondary" className="ml-1">
              WebP / AVIF / JPEG / PNG
            </Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            支持拖拽/上传多图，按需重采样+重编码，尽可能选择更高效格式（自动回退）。
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 拖拽上传 */}
          <div ref={dropRef} onDrop={onDrop} onDragOver={onDrag} className="rounded-md border border-dashed p-6 text-center bg-muted/30">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <UploadCloud className="w-5 h-5" />
              拖拽图片到此，或
              <label className="cursor-pointer text-primary underline">
                点击选择
                <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
              </label>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">支持多图；SVG/GIF 将尝试转为位图后再编码</div>
          </div>

          {/* 压缩配置 */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings2 className="w-4 h-4" />
              压缩配置
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">输出格式</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">跟随原始</SelectItem>
                    <SelectItem value="webp">
                      WebP{!support.webp ? "（当前浏览器不支持）" : ""}
                    </SelectItem>
                    <SelectItem value="avif">
                      AVIF{!support.avif ? "（当前浏览器不支持）" : ""}
                    </SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">质量（{quality}%）</Label>
                <div className="px-1">
                  <Slider
                    value={[quality]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(v) => setQuality(v[0])}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">采样策略</Label>
                <Select value={sampling} onValueChange={(v) => setSampling(v as Sampling)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动（平衡）</SelectItem>
                    <SelectItem value="fast">快速（低耗）</SelectItem>
                    <SelectItem value="quality">尽量保真（高质量）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">最大宽</Label>
                <Input type="number" value={maxW} onChange={(e) => setMaxW(parseInt(e.target.value || "0") || 0)} />
              </div>
              <div>
                <Label className="text-xs">最大高</Label>
                <Input type="number" value={maxH} onChange={(e) => setMaxH(parseInt(e.target.value || "0") || 0)} />
              </div>
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Checkbox checked={keepAspect} onCheckedChange={(v) => setKeepAspect(!!v)} id="keep-aspect" />
                  <Label htmlFor="keep-aspect" className="text-xs cursor-pointer">保持比例</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={noUpscale} onCheckedChange={(v) => setNoUpscale(!!v)} id="no-upscale" />
                  <Label htmlFor="no-upscale" className="text-xs cursor-pointer">不放大</Label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">背景（透明填充）</Label>
                <div className="flex items-center gap-2">
                  <Select value={bgMode} onValueChange={(v) => setBgMode(v as "transparent" | "white" | "black" | "custom")}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transparent">透明</SelectItem>
                      <SelectItem value="white">白色</SelectItem>
                      <SelectItem value="black">黑色</SelectItem>
                      <SelectItem value="custom">自定义颜色</SelectItem>
                    </SelectContent>
                  </Select>
                  {bgMode === "custom" && (
                    <>
                      <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 p-1" />
                      <Input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-28" />
                    </>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  说明：透明 PNG/WebP/AVIF 需要非透明背景时可填充为指定颜色。
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={processBatch} disabled={nextBatch === 0}>
                批量压缩（最多{BATCH_LIMIT}张）
              </Button>
              <Button type="button" variant="outline" onClick={downloadAll} disabled={!items.some((i) => i.outUrl)}>
                下载全部
              </Button>
              <Button type="button" variant="outline" onClick={clearAll} disabled={!items.length}>
                <Trash2 className="w-4 h-4 mr-1" /> 清空列表
              </Button>
              <span className="text-[11px] text-muted-foreground ml-2">
                待压缩：{pendingCount}，本次将处理 {nextBatch} 张
              </span>
            </div>
          </div>

          {/* 列表：每行一个结果 */}
          <div className="space-y-3">
            {items.map((it) => (
              <Card key={it.id}>
                <CardContent className="py-4">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">原图</div>
                      <div className="rounded-md border p-2 overflow-hidden">
                        <img src={it.url} alt="original" className="max-w-full h-40 object-contain" />
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {it.width}×{it.height} · {formatBytes(it.size)}
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">压缩后</div>
                      <div className="rounded-md border p-2 min-h-40 flex items-center justify-center overflow-hidden">
                        {it.status === "processing" && <div className="text-xs text-muted-foreground">处理中…</div>}
                        {it.status === "error" && <div className="text-xs text-red-500">{it.error}</div>}
                        {it.status !== "processing" && it.outUrl && (
                          <img src={it.outUrl} alt="compressed" className="max-w-full h-40 object-contain" />
                        )}
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {it.outSize ? (
                          <>
                            {it.outWidth}×{it.outHeight} · {formatBytes(it.outSize)} · 压缩率{" "}
                            {it.size && it.outSize ? Math.max(0, (1 - it.outSize / it.size) * 100).toFixed(1) : "-"}%
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-2">
                      <Button type="button" onClick={() => processOne(it, format)} disabled={it.status === "processing"}>
                        压缩
                      </Button>
                      <Button type="button" variant="outline" onClick={() => downloadOne(it)} disabled={!it.outUrl}>
                        下载
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => it.outUrl && copyUrl(it.outUrl)} disabled={!it.outUrl}>
                        {copiedUrl ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        复制 URL
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!items.length && <div className="text-center text-sm text-muted-foreground">请先上传或拖拽图片进行压缩</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}