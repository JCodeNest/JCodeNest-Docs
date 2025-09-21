"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { 
  Palette,
  Copy,
  CheckCircle,
  Shuffle,
  Download,
  Upload,
  Eye,
  Pipette,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ColorFormat {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  hsv: { h: number; s: number; v: number }
  cmyk: { c: number; m: number; y: number; k: number }
}

interface ColorHistory {
  color: ColorFormat
  timestamp: Date
}

// 预设调色板
const presetPalettes = {
  material: [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3",
    "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39",
    "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#795548", "#9E9E9E"
  ],
  tailwind: [
    "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E",
    "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1",
    "#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#64748B"
  ],
  pastel: [
    "#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF", "#D4BAFF",
    "#FFBAF3", "#FFC9BA", "#C9FFBA", "#BAFFFF", "#E1BAFF", "#FFBAE1"
  ]
}

export function ColorPicker() {
  const [currentColor, setCurrentColor] = useState<ColorFormat>({
    hex: "#3B82F6",
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    hsv: { h: 217, s: 76, v: 96 },
    cmyk: { c: 76, m: 47, y: 0, k: 4 }
  })
  
  const [history, setHistory] = useState<ColorHistory[]>([])
  const [copySuccess, setCopySuccess] = useState<string>("")
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof presetPalettes>("material")
  const [inputValue, setInputValue] = useState("")
  const [inputType, setInputType] = useState<"hex" | "rgb">("hex")

  // 颜色转换函数
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }, [])

  const rgbToHex = useCallback((r: number, g: number, b: number) => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16)
      return hex.length === 1 ? "0" + hex : hex
    }).join("")
  }, [])

  const rgbToHsl = useCallback((r: number, g: number, b: number) => {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }, [])

  const rgbToHsv = useCallback((r: number, g: number, b: number) => {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min
    
    let h = 0
    const s = max === 0 ? 0 : diff / max
    const v = max

    if (diff !== 0) {
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break
        case g: h = (b - r) / diff + 2; break
        case b: h = (r - g) / diff + 4; break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    }
  }, [])

  const rgbToCmyk = useCallback((r: number, g: number, b: number) => {
    r /= 255
    g /= 255
    b /= 255
    
    const k = 1 - Math.max(r, g, b)
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k)
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k)
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k)

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    }
  }, [])

  const updateColor = useCallback((hex: string) => {
    const rgb = hexToRgb(hex)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    
    const newColor: ColorFormat = { hex, rgb, hsl, hsv, cmyk }
    setCurrentColor(newColor)
    
    // 添加到历史记录
    setHistory(prev => {
      const filtered = prev.filter(item => item.color.hex !== hex)
      return [{ color: newColor, timestamp: new Date() }, ...filtered.slice(0, 19)]
    })
  }, [hexToRgb, rgbToHsl, rgbToHsv, rgbToCmyk])

  const handleCopy = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(format)
      setTimeout(() => setCopySuccess(""), 1500)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const generateRandomColor = () => {
    const randomHex = "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    updateColor(randomHex)
  }

  // 处理颜色输入
  const handleColorInput = (value: string) => {
    setInputValue(value)
    
    if (inputType === "hex") {
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        updateColor(value)
      }
    } else if (inputType === "rgb") {
      const rgbMatch = value.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number)
        if (r <= 255 && g <= 255 && b <= 255) {
          const hex = rgbToHex(r, g, b)
          updateColor(hex)
        }
      }
    }
  }

  // 生成渐变色
  const generateGradient = useMemo(() => {
    const colors = history.slice(0, 3).map(h => h.color.hex)
    if (colors.length < 2) {
      colors.push(currentColor.hex, "#ffffff")
    }
    return `linear-gradient(135deg, ${colors.join(", ")})`
  }, [history, currentColor.hex])

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateRandomColor}>
            <Shuffle className="w-4 h-4 mr-1" />
            随机颜色
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="color-picker" className="text-sm">自定义:</Label>
            <input
              id="color-picker"
              type="color"
              value={currentColor.hex}
              onChange={(e) => updateColor(e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {currentColor.hex}
          </Badge>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 主颜色显示和控制 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">颜色选择器</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 颜色预览 */}
            <div className="space-y-4">
              <div 
                className="w-full h-32 rounded-lg border-2 border-border shadow-inner"
                style={{ backgroundColor: currentColor.hex }}
              />
              
              {/* 渐变预览 */}
              <div 
                className="w-full h-16 rounded-lg border border-border"
                style={{ background: generateGradient }}
              />
            </div>

            {/* 颜色输入 */}
            <div className="space-y-4">
              {/* 快速输入区域 */}
              <div className="space-y-3">
                <Label>快速输入颜色值</Label>
                <div className="flex gap-2">
                  <select
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value as "hex" | "rgb")}
                    className="px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="hex">HEX</option>
                    <option value="rgb">RGB</option>
                  </select>
                  <Input
                    placeholder={inputType === "hex" ? "#FF5733" : "rgb(255, 87, 51)"}
                    value={inputValue}
                    onChange={(e) => handleColorInput(e.target.value)}
                    className="font-mono flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (inputType === "hex" && /^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
                        updateColor(inputValue)
                      } else if (inputType === "rgb") {
                        const rgbMatch = inputValue.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
                        if (rgbMatch) {
                          const [, r, g, b] = rgbMatch.map(Number)
                          if (r <= 255 && g <= 255 && b <= 255) {
                            const hex = rgbToHex(r, g, b)
                            updateColor(hex)
                          }
                        }
                      }
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 当前颜色值显示 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hex-display">HEX</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hex-display"
                      value={currentColor.hex}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(currentColor.hex, "HEX")}
                    >
                      {copySuccess === "HEX" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>RGB</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(`rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`, "RGB")}
                    >
                      {copySuccess === "RGB" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* HSL 滑块 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>色相 (H): {currentColor.hsl.h}°</Label>
                <Slider
                  value={[currentColor.hsl.h]}
                  onValueChange={([h]) => {
                    const { s, l } = currentColor.hsl
                    const rgb = hslToRgb(h, s, l)
                    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
                    updateColor(hex)
                  }}
                  max={360}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>饱和度 (S): {currentColor.hsl.s}%</Label>
                <Slider
                  value={[currentColor.hsl.s]}
                  onValueChange={([s]) => {
                    const { h, l } = currentColor.hsl
                    const rgb = hslToRgb(h, s, l)
                    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
                    updateColor(hex)
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>亮度 (L): {currentColor.hsl.l}%</Label>
                <Slider
                  value={[currentColor.hsl.l]}
                  onValueChange={([l]) => {
                    const { h, s } = currentColor.hsl
                    const rgb = hslToRgb(h, s, l)
                    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
                    updateColor(hex)
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 侧边栏 - 调色板和历史 */}
        <div className="space-y-4">
          {/* 颜色格式 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">颜色格式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">HSL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(`hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`, "HSL")}
                  >
                    {copySuccess === "HSL" ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="font-mono text-xs">
                  hsl({currentColor.hsl.h}, {currentColor.hsl.s}%, {currentColor.hsl.l}%)
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">HSV</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(`hsv(${currentColor.hsv.h}, ${currentColor.hsv.s}%, ${currentColor.hsv.v}%)`, "HSV")}
                  >
                    {copySuccess === "HSV" ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="font-mono text-xs">
                  hsv({currentColor.hsv.h}, {currentColor.hsv.s}%, {currentColor.hsv.v}%)
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">CMYK</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(`cmyk(${currentColor.cmyk.c}%, ${currentColor.cmyk.m}%, ${currentColor.cmyk.y}%, ${currentColor.cmyk.k}%)`, "CMYK")}
                  >
                    {copySuccess === "CMYK" ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="font-mono text-xs">
                  cmyk({currentColor.cmyk.c}%, {currentColor.cmyk.m}%, {currentColor.cmyk.y}%, {currentColor.cmyk.k}%)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 调色板 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">调色板</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedPalette} onValueChange={(value) => setSelectedPalette(value as keyof typeof presetPalettes)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="material">Material</TabsTrigger>
                  <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
                  <TabsTrigger value="pastel">Pastel</TabsTrigger>
                </TabsList>
                
                {Object.entries(presetPalettes).map(([key, colors]) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    <div className="grid grid-cols-6 gap-2">
                      {colors.map((color, index) => (
                        <button
                          key={index}
                          className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => updateColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>


            </CardContent>
          </Card>

          {/* 历史记录 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近使用</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {history.slice(0, 12).map((item, index) => (
                  <button
                    key={index}
                    className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: item.color.hex }}
                    onClick={() => updateColor(item.color.hex)}
                    title={`${item.color.hex} - ${item.timestamp.toLocaleTimeString()}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// HSL to RGB 转换函数
function hslToRgb(h: number, s: number, l: number) {
  h /= 360
  s /= 100
  l /= 100
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}