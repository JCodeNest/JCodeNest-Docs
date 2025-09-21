"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Sigma, Info } from "lucide-react"

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

type Options = {
  showPrefix: boolean
  upperCase: boolean
  group: "none" | "4" | "8"
  fractionDigits: number // for fractional conversion rounding
  enableFraction: boolean
}

const BASE_ITEMS = [2, 8, 10, 16, 36] as const

function detectBase(input: string): { base: number; normalized: string; negative: boolean } {
  let s = input.trim()
  let negative = false
  if (s.startsWith("+")) s = s.slice(1)
  if (s.startsWith("-")) { negative = true; s = s.slice(1) }

  // prefixes
  if (s.startsWith("0b") || s.startsWith("0B")) return { base: 2, normalized: s.slice(2), negative }
  if (s.startsWith("0o") || s.startsWith("0O")) return { base: 8, normalized: s.slice(2), negative }
  if (s.startsWith("0x") || s.startsWith("0X")) return { base: 16, normalized: s.slice(2), negative }

  // guess: if contains letters beyond 1-9a-z -> assume up to 36; default 10
  // But safer: default to 10 and allow user to choose manually
  return { base: 10, normalized: s, negative }
}

function charToVal(ch: string): number {
  const code = ch.charCodeAt(0)
  if (code >= 48 && code <= 57) return code - 48 // 0-9
  if (code >= 65 && code <= 90) return code - 65 + 10 // A-Z
  if (code >= 97 && code <= 122) return code - 97 + 10 // a-z
  return -1
}

function isValidForBase(s: string, base: number, allowFraction: boolean): boolean {
  if (!s) return false
  let dotCount = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === "_") continue // allow underscore separators
    if (ch === ".") {
      if (!allowFraction) return false
      dotCount++
      if (dotCount > 1) return false
      continue
    }
    const v = charToVal(ch)
    if (v < 0 || v >= base) return false
  }
  return true
}

function parseToDecimal(s: string, base: number, enableFraction: boolean): { ok: boolean; value: number } {
  // limit precision to avoid huge floats
  const [intPart, fracPartRaw = ""] = s.split(".")
  // integer
  let intVal = 0
  for (let i = 0; i < intPart.length; i++) {
    const ch = intPart[i]
    if (ch === "_") continue
    const v = charToVal(ch)
    if (v < 0 || v >= base) return { ok: false, value: NaN }
    intVal = intVal * base + v
    // clamp to safe range
    if (!Number.isFinite(intVal)) return { ok: false, value: NaN }
  }

  let fracVal = 0
  if (enableFraction && fracPartRaw) {
    let denom = base
    for (let i = 0; i < fracPartRaw.length; i++) {
      const ch = fracPartRaw[i]
      if (ch === "_") continue
      const v = charToVal(ch)
      if (v < 0 || v >= base) return { ok: false, value: NaN }
      fracVal += v / denom
      denom *= base
      if (!Number.isFinite(fracVal)) break
    }
  }

  return { ok: true, value: intVal + fracVal }
}

function toBaseString(n: number, base: number, fractionDigits: number, enableFraction: boolean, upperCase: boolean): string {
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)

  // integer part
  const intPart = Math.floor(abs)
  const intStr = intPart.toString(base)

  let fracStr = ""
  if (enableFraction) {
    const frac = abs - intPart
    if (frac > 0 && fractionDigits > 0) {
      let out = ""
      let cur = frac
      for (let i = 0; i < fractionDigits; i++) {
        cur *= base
        const digit = Math.floor(cur + 1e-12) // epsilon
        out += digit.toString(base)
        cur -= digit
        if (cur < 1e-15) break
      }
      fracStr = out
    }
  }

  let res = fracStr ? intStr + "." + fracStr : intStr
  res = upperCase ? res.toUpperCase() : res
  return sign + res
}

function addPrefix(base: number, s: string, showPrefix: boolean): string {
  if (!showPrefix) return s
  if (s.startsWith("-")) {
    const body = s.slice(1)
    return "-" + addPrefix(base, body, true)
  }
  if (base === 2) return "0b" + s
  if (base === 8) return "0o" + s
  if (base === 16) return "0x" + s
  return s
}

function groupDigits(s: string, mode: "none" | "4" | "8"): string {
  if (mode === "none") return s
  const neg = s.startsWith("-")
  if (neg) s = s.slice(1)
  const parts = s.split(".")
  const a = parts[0]
  const b = parts[1]
  const size = mode === "4" ? 4 : 8
  const rev = a.split("").reverse()
  const grouped: string[] = []
  for (let i = 0; i < rev.length; i++) {
    grouped.push(rev[i])
    if ((i + 1) % size === 0 && i !== rev.length - 1) grouped.push("_")
  }
  const left = grouped.reverse().join("")
  const res = b ? left + "." + b : left
  return neg ? "-" + res : res
}

function formatOut(base: number, val: string, opt: Options): string {
  const withCase = opt.upperCase ? val.toUpperCase() : val.toLowerCase()
  const withPrefix = addPrefix(base, withCase, opt.showPrefix)
  return groupDigits(withPrefix, opt.group)
}

export default function BaseConverter() {
  const { copied, copy } = useClipboard()
  const [raw, setRaw] = useState("")
  const [base, setBase] = useState<number>(10)
  const [opt, setOpt] = useState<Options>({
    showPrefix: true,
    upperCase: true,
    group: "4",
    fractionDigits: 8,
    enableFraction: true,
  })
  const [tab, setTab] = useState<"common" | "custom">("common")
  const [customBase, setCustomBase] = useState<number>(16)
  const [customVal, setCustomVal] = useState("")

  const detected = useMemo(() => detectBase(raw), [raw])

  const normalizedInput = useMemo(() => {
    // use detected only if user base not manually changed? We offer manual selector; keep both:
    return detected.normalized
  }, [detected])

  const parseResult = useMemo(() => {
    const b = base || 10
    const s = normalizedInput
    if (!isValidForBase(s, b, opt.enableFraction)) return { ok: false, value: NaN }
    const parsed = parseToDecimal(s, b, opt.enableFraction)
    return parsed
  }, [normalizedInput, base, opt.enableFraction])

  const decValue = useMemo(() => {
    if (!parseResult.ok) return NaN
    const v = parseResult.value
    return detected.negative ? -v : v
  }, [parseResult, detected])

  const outputs = useMemo(() => {
    if (!Number.isFinite(decValue)) return null
    const values: { base: number; label: string; value: string }[] = []
    const list = Array.from(new Set([...BASE_ITEMS, base])).sort((a,b)=>a-b)
    for (const b of list) {
      const v = toBaseString(decValue, b, opt.fractionDigits, opt.enableFraction, opt.upperCase)
      values.push({ base: b, label: b.toString(), value: formatOut(b, v, opt) })
    }
    return values
  }, [decValue, base, opt])

  const validity = useMemo(() => {
    if (!raw.trim()) return { ok: true, msg: "请输入要转换的数值" }
    if (!isValidForBase(normalizedInput, base, opt.enableFraction)) return { ok: false, msg: "当前进制下输入不合法" }
    if (!parseResult.ok) return { ok: false, msg: "解析失败，请检查格式" }
    return { ok: true, msg: "" }
  }, [raw, normalizedInput, base, opt.enableFraction, parseResult])

  return (
    <div className="w-full overflow-x-hidden">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <Sigma className="w-5 h-5" />
            进制转换
            <Badge variant="secondary" className="ml-1">2–36</Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            支持 0b/0o/0x 前缀、负号、小数、下划线分隔符；显示分组与大小写仅影响结果展示。
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">输入</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <Label htmlFor="val" className="text-xs">数值</Label>
                    <Input
                      id="val"
                      value={raw}
                      onChange={(e) => setRaw(e.target.value)}
                      placeholder="例如：0b1010、0x2A、42、-1A.3、1_000_000"
                    />
                    {!validity.ok && (
                      <div className="text-xs text-red-500 mt-1">{validity.msg}</div>
                    )}</div>
                  <div>
                    <Label className="text-xs">输入进制</Label>
                    <Select value={String(base)} onValueChange={(v) => setBase(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择进制" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 35 }, (_, i) => i + 2).map((b) => (
                          <SelectItem key={b} value={String(b)}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      识别到前缀：{detectBase(raw).base}（仅参考）
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="flex items-center justify-between gap-2 p-2 rounded-md border">
                    <div className="text-xs">显示前缀</div>
                    <Switch checked={opt.showPrefix} onCheckedChange={(v) => setOpt({ ...opt, showPrefix: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-md border">
                    <div className="text-xs">大写</div>
                    <Switch checked={opt.upperCase} onCheckedChange={(v) => setOpt({ ...opt, upperCase: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-md border">
                    <div className="text-xs">分组</div>
                    <Select value={opt.group} onValueChange={(v) => setOpt({ ...opt, group: v as "none"|"4"|"8" })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无</SelectItem>
                        <SelectItem value="4">每4位</SelectItem>
                        <SelectItem value="8">每8位</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-md border">
                    <div className="text-xs">小数开启</div>
                    <Switch checked={opt.enableFraction} onCheckedChange={(v) => setOpt({ ...opt, enableFraction: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-md border">
                    <div className="text-xs">小数位</div>
                    <Select value={String(opt.fractionDigits)} onValueChange={(v) => setOpt({ ...opt, fractionDigits: parseInt(v) })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,2,4,6,8,12,16].map(n => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">进制知识简介</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>进制是数位制的简称，常见有二进制(0b)、八进制(0o)、十进制、十六进制(0x)。不同进制用不同“位权”表示同一数值。</p>
                <p>前缀规范：0b、0o、0x 分别表示二、八、十六进制；显示前缀仅影响展示，不改变数值本身。</p>
                <p>常见注意：<br />• 浮点小数存在精度误差，转换时可设置小数位。<br />• 大写/小写仅影响 A–Z 的显示。<br />• 分组(每4位/每8位)仅便于阅读。</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "common" | "custom")} className="mt-2">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="common">常用进制</TabsTrigger>
              <TabsTrigger value="custom">自定义输出</TabsTrigger>
            </TabsList>

            <TabsContent value="common" className="space-y-3 pt-3">
              <div className="space-y-3">
                {BASE_ITEMS.map((b) => {
                  const val = outputs ? outputs.find(o => o.base === b)?.value ?? "" : ""
                  return (
                    <div key={b} className="rounded-md border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span>{b} 进制</span>
                          <Badge variant="secondary">base {b}</Badge>
                        </div>
                        <CopyBtn text={val} />
                      </div>
                      <Textarea
                        readOnly
                        value={val}
                        className="font-mono text-xs h-28 resize-none overflow-auto break-all"
                      />
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-3 pt-3">
              <div className="text-xs text-muted-foreground">
                适用于非常用进制（如 base3/base5/base20 等）临时查看结果，不影响上方输入进制设置。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <Label className="text-xs">自定义进制 (2–36)</Label>
                  <Input
                    type="number"
                    min={2}
                    max={36}
                    defaultValue={base}
                    onChange={(e) => {
                      const v = parseInt(e.target.value || "10", 10)
                      if (v >= 2 && v <= 36) {
                        const val = Number.isFinite(decValue)
                          ? formatOut(v, toBaseString(decValue, v, opt.fractionDigits, opt.enableFraction, opt.upperCase), opt)
                          : ""
                        setCustomVal(val)
                        setCustomBase(v)
                      }
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <CopyBtn text={customVal} />
                </div>
              </div>
              <Textarea readOnly value={customVal} className="font-mono text-xs h-40 resize-none overflow-auto break-all" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const { copied, copy } = useClipboard()
  return (
    <Button size="sm" variant="outline" onClick={() => copy(text)} disabled={!text}>
      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
      复制
    </Button>
  )
}

// Local state for custom output
function useCustomOut() {
  const [customBase, setCustomBase] = useState<number>(16)
  const [customVal, setCustomVal] = useState("")
  return { customBase, setCustomBase, customVal, setCustomVal }
}

function BaseConverterWrapper() {
  // expose custom out hook inside same file scope
  return null
}