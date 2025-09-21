"use client"

import * as React from "react"
import SignaturePad from "signature_pad"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export function SignatureDesigner() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const padRef = React.useRef<SignaturePad | null>(null)

  const [color, setColor] = React.useState("#111111")
  const [bg, setBg] = React.useState<"transparent" | "white">("transparent")
  const [thickness, setThickness] = React.useState(2)

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
    const w = Math.min(parent?.clientWidth ?? 600, 900)
    const h = Math.round(w * 0.45)

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (bg === "white") {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, w, h)
    } else {
      ctx.clearRect(0, 0, w, h)
    }

    // 重新初始化签名板避免缩放后坐标错位
    if (padRef.current) {
      const prev = padRef.current.toData()
      padRef.current.clear()
      padRef.current = new SignaturePad(canvas, {
        penColor: color,
        minWidth: Math.max(0.5, thickness - 1),
        maxWidth: Math.max(1.5, thickness + 1),
        throttle: 16,
      })
      if (prev.length) {
        try {
          padRef.current.fromData(prev)
        } catch {
          // 忽略缩放后恢复失败
        }
      }
    }
  }, [bg, color, thickness])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pad = new SignaturePad(canvas, {
      penColor: color,
      minWidth: Math.max(0.5, thickness - 1),
      maxWidth: Math.max(1.5, thickness + 1),
      throttle: 16,
    })
    padRef.current = pad
    resizeCanvas()
    const onResize = () => resizeCanvas()
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      pad.off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (padRef.current) {
      padRef.current.penColor = color
    }
  }, [color])

  React.useEffect(() => {
    if (padRef.current) {
      padRef.current.minWidth = Math.max(0.5, thickness - 1)
      padRef.current.maxWidth = Math.max(1.5, thickness + 1)
    }
  }, [thickness])

  React.useEffect(() => {
    resizeCanvas()
  }, [bg, resizeCanvas])

  const handleClear = () => padRef.current?.clear()

  const handleUndo = () => {
    const pad = padRef.current
    if (!pad) return
    const data = pad.toData()
    if (data && data.length > 0) {
      data.pop()
      pad.fromData(data)
    }
  }

  const download = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
  }

  const exportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    download(url, `signature-${Date.now()}.png`)
  }

  const exportSVG = () => {
    const pad = padRef.current
    if (!pad) return
    const svg = pad.toSVG()
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    download(url, `signature-${Date.now()}.svg`)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full h-full">
      <Card>
        <CardHeader>
          <CardTitle>在线电子签名</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>画笔颜色</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-14 h-10 p-0"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>笔画粗细：{thickness}px</Label>
              <Slider
                className="w-full touch-none select-none"
                value={[thickness]}
                onValueChange={([v]) => setThickness(v)}
                min={1}
                max={12}
                step={0.5}
              />
            </div>
            <div className="space-y-2">
              <Label>背景</Label>
              <div className="inline-flex items-center rounded-md border p-0.5 bg-muted/40 gap-0">
                <Button
                  size="sm"
                  className="rounded-[6px]"
                  variant={bg === "transparent" ? "default" : "ghost"}
                  onClick={() => setBg("transparent")}
                >
                  透明
                </Button>
                <Button
                  size="sm"
                  className="rounded-[6px]"
                  variant={bg === "white" ? "default" : "ghost"}
                  onClick={() => setBg("white")}
                >
                  白底
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <canvas
              ref={canvasRef}
              className="w-full h-auto touch-manipulation select-none rounded-md bg-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleUndo}>
              撤销
            </Button>
            <Button variant="outline" onClick={handleClear}>
              清空
            </Button>
            <Button onClick={exportPNG}>导出 PNG</Button>
            <Button onClick={exportSVG}>导出 SVG</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignatureDesigner