"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Regex, Trash2, Copy, Check, Info, Wand2, BookOpen } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type Flags = {
  g: boolean
  i: boolean
  m: boolean
  s: boolean
  u: boolean
  y: boolean
}

type Preset = {
  id: string
  name: string
  pattern: string
  flags?: string
  note?: string
  example?: string
}

const PRESETS: Preset[] = [
  { id: "email", name: "邮箱 Email", pattern: "^[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}$", flags: "", note: "常规邮箱校验" },
  { id: "url", name: "URL(简单)", pattern: "^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]+(\\/\\S*)?$", flags: "i", note: "简单 URL 检查" },
  { id: "ipv4", name: "IPv4", pattern: "^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)$" },
  { id: "cnphone", name: "中国手机号", pattern: "^1\\d{10}$" },
  { id: "date", name: "日期(YYYY-MM-DD)", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
  { id: "uuid", name: "UUID v4", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", flags: "i" },
  { id: "hex", name: "十六进制颜色", pattern: "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$" },
  { id: "postal", name: "中国邮编", pattern: "^\\d{6}$" },
]

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
}

function highlight(text: string, re: RegExp) {
  if (!re.global) {
    const m = text.match(re)
    if (!m) return `<pre class=\"whitespace-pre-wrap\">${escapeHtml(text)}</pre>`
    const match = m[0]
    const idx = m.index ?? 0
    const before = escapeHtml(text.slice(0, idx))
    const mid = escapeHtml(match)
    const after = escapeHtml(text.slice(idx + match.length))
    return `<pre class=\"whitespace-pre-wrap\">${before}<mark class=\"bg-yellow-200 dark:bg-yellow-900 rounded px-0.5\">${mid}</mark>${after}</pre>`
  }
  let last = 0
  let out = ""
  text.replace(re, (match, ...args) => {
    const idx = args[args.length - 2] as number // match index
    out += escapeHtml(text.slice(last, idx))
    out += `<mark class=\"bg-yellow-200 dark:bg-yellow-900 rounded px-0.5\">${escapeHtml(match)}</mark>`
    last = idx + match.length
    return match
  })
  out += escapeHtml(text.slice(last))
  return `<pre class=\"whitespace-pre-wrap\">${out}</pre>`
}

function buildFlags(flags: Flags) {
  return (flags.g ? "g" : "") + (flags.i ? "i" : "") + (flags.m ? "m" : "") + (flags.s ? "s" : "") + (flags.u ? "u" : "") + (flags.y ? "y" : "")
}

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

export default function RegexTester() {
  const [pattern, setPattern] = useState("")
  const [testText, setTestText] = useState("")
  const [replaceWith, setReplaceWith] = useState("")
  const [flags, setFlags] = useState<Flags>({ g: true, i: false, m: false, s: false, u: false, y: false })
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useClipboard()

  const re = useMemo(() => {
    setError(null)
    try {
      // 使用 new RegExp 而不是 /.../ 动态构建
      const f = buildFlags(flags)
      return pattern ? new RegExp(pattern, f) : null
    } catch (e: unknown) {
      setError((e as Error).message)
      return null
    }
  }, [pattern, flags])

  const htmlPreview = useMemo(() => {
    if (!re) return `<pre class=\"whitespace-pre-wrap\">${escapeHtml(testText)}</pre>`
    try {
      // 每次高亮需要从头重新生成全局正则
      const f = buildFlags(flags)
      const re2 = new RegExp(pattern, f)
      return highlight(testText, re2)
    } catch {
      return `<pre class=\"whitespace-pre-wrap\">${escapeHtml(testText)}</pre>`
    }
  }, [re, testText, pattern, flags])

  const matches = useMemo(() => {
    if (!re) return []
    const out: { index: number; match: string; groups?: Record<string, string> }[] = []
    const f = buildFlags(flags)
    const globalRe = new RegExp(pattern, f.includes("g") ? f : f + "g")
    let m: RegExpExecArray | null
    while ((m = globalRe.exec(testText)) !== null) {
      out.push({ index: m.index, match: m[0], groups: (m as RegExpExecArray & { groups?: Record<string, string> }).groups })
      if (!m[0]) {
        globalRe.lastIndex++
      }
    }
    return out
  }, [re, testText, pattern, flags])

  const replaced = useMemo(() => {
    if (!re) return testText
    try {
      const f = buildFlags(flags)
      const re2 = new RegExp(pattern, f)
      return testText.replace(re2, replaceWith)
    } catch {
      return testText
    }
  }, [re, testText, pattern, flags, replaceWith])

  const applyPreset = (p: Preset) => {
    setPattern(p.pattern)
    if (typeof p.flags === "string") {
      const set = new Set(p.flags.split(""))
      setFlags({ g: set.has("g"), i: set.has("i"), m: set.has("m"), s: set.has("s"), u: set.has("u"), y: set.has("y") })
    }
  }

  // 常见生成器（简化版）
  const [genTab, setGenTab] = useState<"email" | "mobile" | "username" | "number" | "url" | "date">("email")
  const [usernameLen, setUsernameLen] = useState(12)
  const generators = {
    email: () => "^[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}$",
    mobile: () => "^1\\d{10}$",
    username: () => `^[A-Za-z][A-Za-z0-9_]{2,${Math.max(2, usernameLen - 1)}}$`,
    number: () => "^-?\\d+(?:\\.\\d+)?$",
  } as const

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Regex className="w-5 h-5" />
            正则表达式工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 顶部输入区 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>正则表达式</Label>
              <Input
                placeholder="例如：^\\w+@\\w+\\.\\w+$ 或使用命名捕获 (?<name>...)"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="font-mono"
              />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {(["g", "i", "m", "s", "u", "y"] as (keyof Flags)[]).map((k) => (
                  <label key={k} className="inline-flex items-center gap-1">
                    <Switch checked={flags[k]} onCheckedChange={(v) => setFlags((old) => ({ ...old, [k]: !!v }))} />
                    <span>/{k}</span>
                  </label>
                ))}
              </div>
              {error && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>测试文本</Label>
              <Textarea
                rows={6}
                placeholder="在这里粘贴或输入待匹配文本"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>替换为（可留空）</Label>
              <Input
                placeholder="支持 $1 $& 等引用"
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPattern("")
                    setTestText("")
                    setReplaceWith("")
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  清空
                </Button>
                <Button variant="outline" onClick={() => copy(`/${pattern}/${buildFlags(flags)}`)}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  复制正则
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* 结果区 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">匹配预览</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: htmlPreview }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">匹配列表 / 分组</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {matches.length === 0 ? (
                  <div className="text-sm text-muted-foreground">无匹配结果</div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((m, i) => (
                      <div key={i} className="rounded-md border p-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <Badge variant="secondary" className="mr-2">#{i + 1}</Badge>
                            索引 {m.index}
                          </div>
                          <Badge className="font-mono">{m.match}</Badge>
                        </div>
                        {m.groups && Object.keys(m.groups).length > 0 && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(m.groups).map(([k, v]) => (
                              <div key={k} className="text-xs">
                                <span className="text-muted-foreground mr-1">{k}:</span>
                                <span className="font-mono">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* 常见正则与生成器 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="w-4 h-4" />
                  常见正则(点击应用)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <Button key={p.id} variant="outline" className="justify-start" onClick={() => applyPreset(p)}>
                    <span className="truncate">{p.name}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="w-4 h-4" />
                  正则生成器
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs value={genTab} onValueChange={(v) => setGenTab(v as "email" | "mobile" | "url" | "date")}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="email">邮箱</TabsTrigger>
                    <TabsTrigger value="mobile">手机号</TabsTrigger>
                    <TabsTrigger value="username">用户名</TabsTrigger>
                    <TabsTrigger value="number">数字</TabsTrigger>
                  </TabsList>
                  <TabsContent value="email" className="pt-3">
                    <div className="text-xs text-muted-foreground mb-2">通用邮箱格式</div>
                    <Button size="sm" onClick={() => setPattern(generators.email())}>生成</Button>
                  </TabsContent>
                  <TabsContent value="mobile" className="pt-3">
                    <div className="text-xs text-muted-foreground mb-2">中国大陆手机号</div>
                    <Button size="sm" onClick={() => setPattern(generators.mobile())}>生成</Button>
                  </TabsContent>
                  <TabsContent value="username" className="pt-3 space-y-2">
                    <div className="text-xs text-muted-foreground">以字母开头，可含数字与下划线，长度上限</div>
                    <Input
                      type="number"
                      min={3}
                      max={32}
                      value={usernameLen}
                      onChange={(e) => setUsernameLen(Number(e.target.value || 12))}
                      className="w-24"
                    />
                    <Button size="sm" onClick={() => setPattern(generators.username())}>生成</Button>
                  </TabsContent>
                  <TabsContent value="number" className="pt-3">
                    <div className="text-xs text-muted-foreground mb-2">整数/小数（可负号）</div>
                    <Button size="sm" onClick={() => setPattern(generators.number())}>生成</Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* 速查文档 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4" />
                正则速查
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="font-medium mb-1">元字符</div>
                  <div className="text-muted-foreground">
                    . 任意字符<br/>
                    \\d 数字 / \\w 单词 / \\s 空白<br/>
                    \\D 非数字 / \\W 非单词 / \\S 非空白<br/>
                    [abc] 字符集 / [^abc] 取反
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">量词</div>
                  <div className="text-muted-foreground">
                    a? 0或1 / a* 0或多 / a+ 1或多<br/>
                    a{"{"}n{"}"} 恰n次 / a{"{"}n{","}{"}"} 至少n / a{"{"}n{","}m{"}"} n到m<br/>
                    惰性：在量词后加 ?
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">边界与分组</div>
                  <div className="text-muted-foreground">
                    ^ 开头 / $ 结尾 / \\b 单词边界<br/>
                    ( ) 捕获组 / (?: ) 非捕获 / (?{"<"}name{">"} ) 命名捕获<br/>
                    (?= ) 正向预查 / (?! ) 负向预查
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}