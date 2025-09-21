"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Copy, Check, Clock3, Play, Pause, Info, ChevronDown } from "lucide-react"

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

type Unit = "ms" | "s"
type TZ = "local" | "utc"

function formatDate(date: Date, tz: TZ): string {
  if (tz === "utc") {
    // YYYY-MM-DD HH:mm:ss.SSS UTC
    const pad = (n: number, w = 2) => String(n).padStart(w, "0")
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
      date.getUTCHours()
    )}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${String(date.getUTCMilliseconds()).padStart(3, "0")} UTC`
  }
  // 本地
  const pad = (n: number, w = 2) => String(n).padStart(w, "0")
  const offMin = -date.getTimezoneOffset() // 分钟
  const sign = offMin >= 0 ? "+" : "-"
  const abs = Math.abs(offMin)
  const offStr = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, "0")} GMT${offStr}`
}

// 将 datetime-local 的值和 tz 组合为 Date
function parseDateTimeLocal(value: string, tz: TZ): Date | null {
  if (!value) return null
  // value 形如 "2025-09-21T22:15" 或 "2025-09-21T22:15:30"
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return null
  const [_, Y, M, D, h, m2, s = "0"] = m
  if (tz === "utc") {
    const ms = Date.UTC(Number(Y), Number(M) - 1, Number(D), Number(h), Number(m2), Number(s))
    return new Date(ms)
  } else {
    return new Date(Number(Y), Number(M) - 1, Number(D), Number(h), Number(m2), Number(s))
  }
}

export default function TimestampConverter() {
  const { copied, copy } = useClipboard()

  // 实时时间戳
  const [running, setRunning] = useState(true)
  const [unit, setUnit] = useState<Unit>("ms")
  const [now, setNow] = useState<number>(() => Date.now())
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (running) {
      const tick = () => setNow(Date.now())
      tick()
      const id = window.setInterval(tick, unit === "ms" ? 100 : 1000) // 毫秒视图更丝滑
      timerRef.current = id
      return () => {
        clearInterval(id)
        timerRef.current = null
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [running, unit])

  const nowDisplay = useMemo(() => (unit === "ms" ? String(now) : String(Math.floor(now / 1000))), [now, unit])

  // 转换：时间戳 -> 日期时间
  const [tsInput, setTsInput] = useState<string>("")
  const [tsUnit, setTsUnit] = useState<Unit>("ms")
  const [tsTZ, setTsTZ] = useState<TZ>("local")
  const tsDate = useMemo(() => {
    const n = Number(tsInput.trim())
    if (!Number.isFinite(n)) return null
    const ms = tsUnit === "ms" ? n : n * 1000
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }, [tsInput, tsUnit])

  // 转换：日期时间 -> 时间戳
  // 日期时间 -> 时间戳（DatePicker + time）
  const [dtDate, setDtDate] = useState<Date | undefined>(undefined)
  const [dtTime, setDtTime] = useState<string>("") // HH:mm:ss
  const [dtTZ, setDtTZ] = useState<TZ>("local")
  const [outUnit, setOutUnit] = useState<Unit>("ms")
  function combineDateTime(date: Date | undefined, time: string, tz: TZ): Date | null {
    if (!date) return null
    const m = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
    const hh = m ? parseInt(m[1]) : 0
    const mm = m ? parseInt(m[2]) : 0
    const ss = m && m[3] ? parseInt(m[3]) : 0
    if (tz === "utc") {
      const ms = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hh, mm, ss)
      return new Date(ms)
    } else {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, ss)
    }
  }
  const dtTimestamp = useMemo(() => {
    const d = combineDateTime(dtDate, dtTime, dtTZ)
    if (!d) return { ms: "", s: "" }
    const ms = d.getTime()
    return { ms: String(ms), s: String(Math.floor(ms / 1000)) }
  }, [dtDate, dtTime, dtTZ])

  // Tabs 受控
  const [tab, setTab] = useState<"ts2dt" | "dt2ts">("ts2dt")

  // 自定义模板输出
  const [customTpl, setCustomTpl] = useState("YYYY-MM-DD HH:mm:ss.SSS")
  function pad(n: number, w = 2) { return String(n).padStart(w, "0") }
  function formatWithTemplate(date: Date, tz: TZ, tpl: string) {
    const Y = tz === "utc" ? date.getUTCFullYear() : date.getFullYear()
    const M = (tz === "utc" ? date.getUTCMonth() : date.getMonth()) + 1
    const D = tz === "utc" ? date.getUTCDate() : date.getDate()
    const h = tz === "utc" ? date.getUTCHours() : date.getHours()
    const m = tz === "utc" ? date.getUTCMinutes() : date.getMinutes()
    const s = tz === "utc" ? date.getUTCSeconds() : date.getSeconds()
    const ms = tz === "utc" ? date.getUTCMilliseconds() : date.getMilliseconds()
    const offMin = tz === "utc" ? 0 : -date.getTimezoneOffset()
    const sign = offMin >= 0 ? "+" : "-"
    const abs = Math.abs(offMin)
    const Z = tz === "utc" ? "+00:00" : `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
    return tpl
      .replace(/YYYY/g, String(Y))
      .replace(/MM/g, pad(M))
      .replace(/DD/g, pad(D))
      .replace(/HH/g, pad(h))
      .replace(/mm/g, pad(m))
      .replace(/ss/g, pad(s))
      .replace(/SSS/g, String(ms).padStart(3, "0"))
      .replace(/Z/g, Z)
  }
  const customOut = React.useMemo(() => (tsDate ? formatWithTemplate(tsDate, tsTZ, customTpl) : ""), [tsDate, tsTZ, customTpl])

  // 批量转换
  const [batchIn, setBatchIn] = useState("")
  const [batchUnit, setBatchUnit] = useState<Unit>("ms")
  const [batchTZ, setBatchTZ] = useState<TZ>("local")
  const batchOut = React.useMemo(() => {
    if (!batchIn.trim()) return ""
    const lines = batchIn.split(/\r?\n/)
    const out: string[] = []
    for (const line of lines) {
      const t = line.trim()
      if (!t) { out.push(""); continue }
      const n = Number(t)
      if (!Number.isFinite(n)) { out.push(`(无效) ${t}`); continue }
      const ms = batchUnit === "ms" ? n : n * 1000
      const d = new Date(ms)
      if (isNaN(d.getTime())) { out.push(`(无效) ${t}`); continue }
      out.push(formatDate(d, batchTZ))
    }
    return out.join("\n")
  }, [batchIn, batchUnit, batchTZ])

  // 辅助：datetime-local 需要 YYYY-MM-DDTHH:mm
  function toDateTimeLocalInput(date: Date) {
    const y = date.getFullYear()
    const m = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const h = pad(date.getHours())
    const mi = pad(date.getMinutes())
    return `${y}-${m}-${d}T${h}:${mi}`
  }

  return (
    <div className="w-full overflow-x-hidden">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="w-5 h-5" />
            时间戳转换
            <Badge variant="secondary" className="ml-1">秒 / 毫秒</Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            实时显示当前时间戳，支持秒(ms)/毫秒(s)切换；时间戳与日期时间互转，UTC/本地时区可选。
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">实时时间戳</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                  <div className="md:flex-1">
                    <div className="w-full rounded-lg border bg-muted/40 px-4 py-3 font-mono tracking-wider">
                      <div className="flex items-end gap-2">
                        <div className="text-2xl md:text-4xl leading-none">
                          {unit === "ms" ? nowDisplay.slice(0, -3) : nowDisplay}
                        </div>
                        <div className="text-sm md:text-base text-muted-foreground">
                          {unit === "ms" ? ("." + String(now % 1000).padStart(3, "0")) : "s"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ms">毫秒(ms)</SelectItem>
                        <SelectItem value="s">秒(s)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => copy(nowDisplay)}>
                      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      复制
                    </Button>
                    <Button type="button" variant={running ? "secondary" : "default"} onClick={() => setRunning(!running)}>
                      {running ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                      {running ? "停止" : "开始"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">时间戳快速理解</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>时间戳是自 1970-01-01 00:00:00 起经过的时间量，常见单位：</p>
                <p>• 毫秒(ms)：JavaScript Date.now() 使用的单位。<br/>• 秒(s)：后端接口/Unix 命令常见。</p>
                <p>• 时区：UTC 不带偏移；本地时间会带本机时区偏移。</p>
                <p>• 常见换算：1s = 1000ms；展示格式不影响内部数值。</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
            <TabsList className="grid grid-cols-2 w-full md:w-auto">
              <TabsTrigger value="ts2dt">时间戳 → 日期时间</TabsTrigger>
              <TabsTrigger value="dt2ts">日期时间 → 时间戳</TabsTrigger>
            </TabsList>

            <TabsContent value="ts2dt" className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-xs">时间戳</Label>
                  <Input value={tsInput} onChange={(e) => setTsInput(e.target.value)} placeholder="例如：1695292800000 或 1695292800" />
                </div>
                <div>
                  <Label className="text-xs">单位</Label>
                  <Select value={tsUnit} onValueChange={(v) => setTsUnit(v as Unit)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ms">毫秒(ms)</SelectItem>
                      <SelectItem value="s">秒(s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">时区</Label>
                  <Select value={tsTZ} onValueChange={(v) => setTsTZ(v as TZ)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">本地</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 快捷：用当前时间戳填充 / 清空 */}
              <div className="flex items-center gap-2 -mt-1">
                <Button size="sm" variant="secondary" type="button" onClick={() => {
                  const n = Date.now()
                  setTsInput(tsUnit === "ms" ? String(n) : String(Math.floor(n / 1000)))
                }}>用当前时间戳填充</Button>
                <Button size="sm" variant="ghost" type="button" onClick={() => setTsInput("")}>清空</Button>
              </div>

              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">转换结果</div>
                  <Button size="sm" variant="outline" onClick={() => tsDate && copy(formatDate(tsDate, tsTZ))} disabled={!tsDate}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}复制
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={tsDate ? formatDate(tsDate, tsTZ) : ""}
                  className="font-mono text-xs h-28 resize-none overflow-auto break-all"
                />
                <div className="space-y-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <div>ISO: {tsDate ? (tsTZ === "utc" ? tsDate.toISOString() : new Date(tsDate.getTime() - tsDate.getTimezoneOffset()*60000).toISOString().replace("Z","")) : "-"}</div>
                    <Button size="sm" variant="outline" onClick={() => tsDate && copy(tsTZ === "utc" ? tsDate.toISOString() : new Date(tsDate.getTime() - tsDate.getTimezoneOffset()*60000).toISOString().replace("Z",""))} disabled={!tsDate}>复制</Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>RFC2822: {tsDate ? (tsTZ === "utc" ? tsDate.toUTCString() : tsDate.toString()) : "-"}</div>
                    <Button size="sm" variant="outline" onClick={() => tsDate && copy(tsTZ === "utc" ? tsDate.toUTCString() : tsDate.toString())} disabled={!tsDate}>复制</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>模板</span>
                    <Input className="h-7 text-[11px]" value={customTpl} onChange={(e) => setCustomTpl(e.target.value)} />
                    <Button size="sm" variant="outline" onClick={() => customOut && copy(customOut)} disabled={!customOut}>复制</Button>
                  </div>
                  <div className="font-mono break-all">{customOut || "-"}</div>
                </div>
              </div>

              {/* 批量转换 */}
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">批量转换</div>
                  <Button size="sm" variant="outline" onClick={() => batchOut && copy(batchOut)} disabled={!batchOut}>复制结果</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Label className="text-xs">时间戳（多行）</Label>
                    <Textarea value={batchIn} onChange={(e) => setBatchIn(e.target.value)} placeholder={"例如：\n1695292800000\n1695292800"} className="h-28 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">单位</Label>
                    <Select value={batchUnit} onValueChange={(v) => setBatchUnit(v as Unit)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ms">毫秒(ms)</SelectItem>
                        <SelectItem value="s">秒(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">时区</Label>
                    <Select value={batchTZ} onValueChange={(v) => setBatchTZ(v as TZ)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">本地</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea readOnly value={batchOut} className="font-mono text-xs h-28 resize-none overflow-auto break-all" />
              </div>
            </TabsContent>

            <TabsContent value="dt2ts" className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-xs">日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-40 justify-between font-normal">
                        {dtDate ? dtDate.toLocaleDateString() : "选择日期"}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dtDate}
                        captionLayout="dropdown"
                        onSelect={(d) => setDtDate(d as Date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs">时间</Label>
                  <Input
                    type="time"
                    step="1"
                    value={dtTime}
                    onChange={(e) => setDtTime(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
                <div>
                  <Label className="text-xs">时区解释</Label>
                  <Select value={dtTZ} onValueChange={(v) => setDtTZ(v as TZ)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">按本地解析</SelectItem>
                      <SelectItem value="utc">按 UTC 解析</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">输出单位</Label>
                  <Select value={outUnit} onValueChange={(v) => setOutUnit(v as Unit)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ms">毫秒(ms)</SelectItem>
                      <SelectItem value="s">秒(s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 快捷：填入当前时间(本地) / 清空 */}
              <div className="flex items-center gap-2 -mt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    setDtDate(d)
                    const hh = String(d.getHours()).padStart(2, "0")
                    const mm = String(d.getMinutes()).padStart(2, "0")
                    const ss = String(d.getSeconds()).padStart(2, "0")
                    setDtTime(`${hh}:${mm}:${ss}`)
                  }}
                >
                  填入当前时间(本地)
                </Button>
                <Button size="sm" variant="ghost" type="button" onClick={() => { setDtDate(undefined); setDtTime(""); }}>
                  清空
                </Button>
              </div>

              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">转换结果</div>
                  <Button size="sm" variant="outline" onClick={() => copy(outUnit === "ms" ? dtTimestamp.ms : dtTimestamp.s)} disabled={!dtDate}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}复制
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={outUnit === "ms" ? dtTimestamp.ms : dtTimestamp.s}
                  className="font-mono text-xs h-24 resize-none overflow-auto break-all"
                />
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>毫秒(ms)：{dtTimestamp.ms || "-"}</div>
                  <div>秒(s)：{dtTimestamp.s || "-"}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}