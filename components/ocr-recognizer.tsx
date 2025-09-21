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
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Check, UploadCloud, Info, FileText, Trash2, Play, Pause } from "lucide-react"
import { createWorker } from "tesseract.js"

type Lang = "eng" | "chi_sim"

type Item = {
  id: string
  file: File
  url: string
  name: string
  status: "idle" | "queue" | "processing" | "done" | "error"
  progress: number
  text?: string
  error?: string
}

function useClipboard(timeout = 1200) {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch {}
  }
  return { copied, copy }
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export default function OcrRecognizer() {
  const { copied, copy } = useClipboard()
  const [items, setItems] = useState<Item[]>([])
  const [lang, setLang] = useState<Lang>("chi_sim")
  const [maxEdge, setMaxEdge] = useState(2000)
  const [gray, setGray] = useState(true)
  const [contrast, setContrast] = useState(0) // -100 ~ 100
  const [binarize, setBinarize] = useState(false)
  const [threshold, setThreshold] = useState(180) // 0~255
  const [concurrency, setConcurrency] = useState(2)
  const BATCH_LIMIT = 20

  const runningRef = useRef(true)
  const [running, setRunning] = useState(true)
  const toggleRunning = () => { runningRef.current = !runningRef.current; setRunning(r => !r) }

  const onFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, BATCH_LIMIT) // 限制单次加入数量
    const mapped: Item[] = arr
      .filter(f => f.type.startsWith("image/"))
      .map(f => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        file: f,
        url: URL.createObjectURL(f),
        name: f.name,
        status: "queue",
        progress: 0,
      }))
    setItems(prev => [...prev, ...mapped])
  }, [])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFiles(e.target.files)
  }

  const dropRef = useRef<HTMLDivElement | null>(null)
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) onFiles(e.dataTransfer.files)
  }, [onFiles])
  const onDrag = (e: React.DragEvent) => { e.preventDefault() }

  // 预处理：返回用于 OCR 的 Blob URL
  async function preprocessToBlobUrl(file: File): Promise<string> {
    const img = await createImageBitmap(file)
    let w = img.width, h = img.height
    if (maxEdge > 0) {
      const scale = Math.min(1, maxEdge / Math.max(w, h))
      w = Math.round(w * scale)
      h = Math.round(h * scale)
    }
    const canvas = document.createElement("canvas")
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) { img.close(); return URL.createObjectURL(file) }
    ctx.drawImage(img, 0, 0, w, h)
    img.close()

    if (gray || contrast !== 0 || binarize) {
      const imgData = ctx.getImageData(0, 0, w, h)
      const data = imgData.data
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2]
        if (gray) {
          const y = Math.round(0.299*r + 0.587*g + 0.114*b)
          r = g = b = y
        }
        if (contrast !== 0) {
          const c = clamp(contrast, -100, 100)
          const k = (259 * (c + 255)) / (255 * (259 - c))
          r = clamp(Math.round(k*(r-128)+128), 0, 255)
          g = clamp(Math.round(k*(g-128)+128), 0, 255)
          b = clamp(Math.round(k*(b-128)+128), 0, 255)
        }
        if (binarize) {
          const t = clamp(threshold, 0, 255)
          const y = (r + g + b) / 3
          const v = y >= t ? 255 : 0
          r = g = b = v
        }
        data[i] = r; data[i+1] = g; data[i+2] = b
      }
      ctx.putImageData(imgData, 0, 0)
    }
    return await new Promise<string>((resolve) => {
      canvas.toBlob((b) => resolve(URL.createObjectURL(b!)), "image/png")
    })
  }

  async function recognizeOne(it: Item, language: Lang) {
    setItems(prev => prev.map(x => x.id === it.id ? { ...x, status: "processing", progress: 0 } : x))
    let preUrl: string | null = null
    try {
      preUrl = await preprocessToBlobUrl(it.file)
      const worker = await createWorker(language, 1, {
        // CDN 配置（避免部分地区 jsDelivr 受限）
        workerPath: "https://unpkg.com/tesseract.js@6.0.1/dist/worker.min.js",
        corePath: "https://unpkg.com/tesseract.js-core@6.0.0",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
        logger: (m) => {
          if (m?.progress != null) {
            setItems(prev => prev.map(x => x.id === it.id ? { ...x, progress: Math.round(m.progress * 100) } : x))
          }
        },
      })
      const { data } = await worker.recognize(preUrl!)
      await worker.terminate()
      setItems(prev => prev.map(x => x.id === it.id ? { ...x, status: "done", text: data.text, progress: 100 } : x))
    } catch (e: unknown) {
      setItems(prev => prev.map(x => x.id === it.id ? { ...x, status: "error", error: e instanceof Error ? e.message : "识别失败" } : x))
    } finally {
      if (preUrl) { try { URL.revokeObjectURL(preUrl) } catch {} }
    }
  }

  // 简单并发队列
  const pending = useMemo(() => items.filter(i => i.status === "queue"), [items])
  React.useEffect(() => {
    if (!runningRef.current) return
    const active = items.filter(i => i.status === "processing").length
    const slots = Math.max(1, concurrency) - active
    if (slots <= 0) return
    const next = items.filter(i => i.status === "queue").slice(0, slots)
    if (!next.length) return
    next.forEach(n => { recognizeOne(n, lang) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, concurrency, lang, running])

  // 操作
  const clearAll = () => {
    for (const it of items) {
      try { URL.revokeObjectURL(it.url) } catch {}
    }
    setItems([])
  }
  const copyAll = () => {
    const txt = items.map(i => `# ${i.name}\n${i.text || ""}`).join("\n\n")
    if (txt.trim()) copy(txt)
  }
  const downloadTxt = (it: Item) => {
    const a = document.createElement("a")
    const blob = new Blob([it.text || ""], { type: "text/plain;charset=utf-8" })
    a.href = URL.createObjectURL(blob)
    a.download = `${it.name.replace(/\.[^.]+$/, "")}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }

  const { copied: copiedLine, copy: copyLine } = useClipboard()

  return (
    <div className="w-full overflow-x-hidden">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            图片文字识别（OCR）
            <Badge variant="secondary" className="ml-1">Tesseract.js · 客户端离线</Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            支持中英文，按需加载语言包；提供基础预处理与并发队列，单次最多 {BATCH_LIMIT} 张。
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* 拖拽上传 */}
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={onDrag}
            className="rounded-md border border-dashed p-6 text-center bg-muted/30"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <UploadCloud className="w-5 h-5" />
              拖拽图片到此，或
              <label className="cursor-pointer text-primary underline">
                点击选择
                <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
              </label>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">单次最多 {BATCH_LIMIT} 张；可多次添加。</div>
          </div>

          {/* 参数配置 */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">语言</Label>
                <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="chi_sim">简体中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">最大边（{maxEdge}px）</Label>
                <div className="px-1"><Slider value={[maxEdge]} min={500} max={4000} step={100} onValueChange={(v)=>setMaxEdge(v[0])} /></div>
              </div>
              <div>
                <Label className="text-xs">并发（{concurrency}）</Label>
                <div className="px-1"><Slider value={[concurrency]} min={1} max={4} step={1} onValueChange={(v)=>setConcurrency(v[0])} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={gray} onCheckedChange={(v)=>setGray(!!v)} id="gray" />
                <Label htmlFor="gray" className="text-xs cursor-pointer">灰度</Label>
                <Checkbox checked={binarize} onCheckedChange={(v)=>setBinarize(!!v)} id="bin" className="ml-4" />
                <Label htmlFor="bin" className="text-xs cursor-pointer">二值化</Label>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">对比度（{contrast}）</Label>
                <div className="px-1"><Slider value={[contrast]} min={-100} max={100} step={5} onValueChange={(v)=>setContrast(v[0])} /></div>
              </div>
              {binarize && (
                <div>
                  <Label className="text-xs">阈值（{threshold}）</Label>
                  <div className="px-1"><Slider value={[threshold]} min={0} max={255} step={5} onValueChange={(v)=>setThreshold(v[0])} /></div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={running ? "secondary" : "default"} onClick={toggleRunning}>
                {running ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {running ? "暂停队列" : "继续队列"}
              </Button>
              <Button type="button" variant="outline" onClick={copyAll} disabled={!items.some(i=>i.text)}>
                复制全部结果
              </Button>
              <Button type="button" variant="outline" onClick={clearAll} disabled={!items.length}>
                <Trash2 className="w-4 h-4 mr-1" /> 清空列表
              </Button>
            </div>
          </div>

          {/* 列表（每行一个条目） */}
          <div className="space-y-3">
            {items.map((it) => (
              <Card key={it.id}>
                <CardContent className="py-4">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">{it.name}</div>
                      <div className="rounded-md border p-2 overflow-hidden">
                        <img src={it.url} alt={it.name} className="max-w-full h-40 object-contain" />
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        状态：{it.status} {it.status === "processing" ? `· ${it.progress}%` : ""}
                      </div>
                    </div>
                    <div className="lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs text-muted-foreground">识别结果</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={()=>copyLine(it.text || "")} disabled={!it.text}>
                            {copiedLine ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}复制
                          </Button>
                          <Button size="sm" variant="outline" onClick={()=>downloadTxt(it)} disabled={!it.text}>下载 .txt</Button>
                        </div>
                      </div>
                      <Textarea readOnly value={it.text || ""} className="font-mono text-xs h-40 resize-none overflow-auto break-all" />
                      {it.error && <div className="text-[11px] text-red-500 mt-1">错误：{it.error}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!items.length && <div className="text-center text-sm text-muted-foreground">请先上传或拖拽图片开始识别</div>}
          </div>
        </CardContent>
      </Card>

      {/* 右侧说明（移动端显示在底部） */}
      <div className="mt-4 rounded-md border p-4">
        <div className="text-sm font-medium mb-2">OCR 快速理解</div>
        <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
          <li>• 识别质量与图片清晰度、对比度、尺寸相关。建议最大边不低于 1000px。</li>
          <li>• 多语言会降低速度，建议按需选择语言；默认简体中文。</li>
          <li>• 首次加载语言包较慢（几十 MB 级别），建议稳定网络或使用缓存。</li>
          <li>• 预处理（灰度/对比度/二值化）可显著提升弱对比度文本的识别率。</li>
          <li>• 隐私：识别在浏览器本地完成，图片不上传服务器。</li>
        </ul>
      </div>
    </div>
  )
}