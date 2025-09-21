"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Copy, Check, Link as LinkIcon, Search, Info, ChevronDown } from "lucide-react"

type HttpCode = {
  code: number
  phrase: string
  description: string
  spec?: string
  class: 1 | 2 | 3 | 4 | 5
}

const CODES: HttpCode[] = [
  // 1xx
  { code: 100, phrase: "Continue", description: "服务器已接收请求的初始部分，客户端应继续发送剩余部分。", spec: "RFC 9110", class: 1 },
  { code: 101, phrase: "Switching Protocols", description: "服务器同意切换协议（例如从 HTTP/1.1 升级到其他协议）。", spec: "RFC 9110", class: 1 },
  { code: 102, phrase: "Processing", description: "服务器已接收请求并正在处理，尚无响应可用（WebDAV）。", spec: "RFC 4918", class: 1 },
  { code: 103, phrase: "Early Hints", description: "用于在最终响应前向客户端提前提示可能需要的资源。", spec: "RFC 8297", class: 1 },
  // 2xx
  { code: 200, phrase: "OK", description: "请求成功。响应随方法不同而异（GET 返回资源，POST 返回结果等）。", spec: "RFC 9110", class: 2 },
  { code: 201, phrase: "Created", description: "请求成功并创建了新资源，通常携带 Location 头指向新资源。", spec: "RFC 9110", class: 2 },
  { code: 202, phrase: "Accepted", description: "请求已接受但尚未处理完成，适用于异步任务。", spec: "RFC 9110", class: 2 },
  { code: 203, phrase: "Non-Authoritative Information", description: "返回的元信息可能非原始服务器的权威信息（代理修改）。", spec: "RFC 9110", class: 2 },
  { code: 204, phrase: "No Content", description: "请求成功但无响应实体（常用于 PUT/DELETE）。", spec: "RFC 9110", class: 2 },
  { code: 205, phrase: "Reset Content", description: "请求成功，要求客户端重置文档视图（如表单）。", spec: "RFC 9110", class: 2 },
  { code: 206, phrase: "Partial Content", description: "部分内容（断点续传），响应 Content-Range。", spec: "RFC 9110", class: 2 },
  { code: 207, phrase: "Multi-Status", description: "多个独立操作状态（WebDAV）。", spec: "RFC 4918", class: 2 },
  { code: 208, phrase: "Already Reported", description: "DAV 绑定的成员已在前一响应中列出（WebDAV）。", spec: "RFC 5842", class: 2 },
  { code: 226, phrase: "IM Used", description: "服务器已对资源应用了一个或多个实例操作（HTTP Delta）。", spec: "RFC 3229", class: 2 },
  // 3xx
  { code: 300, phrase: "Multiple Choices", description: "多个可用表示，客户端可选择其中之一。", spec: "RFC 9110", class: 3 },
  { code: 301, phrase: "Moved Permanently", description: "资源已被永久移动到新位置（Location）。", spec: "RFC 9110", class: 3 },
  { code: 302, phrase: "Found", description: "临时重定向（常与 POST->GET 结合）。", spec: "RFC 9110", class: 3 },
  { code: 303, phrase: "See Other", description: "应使用 GET 方法在另一个 URI 获取资源。", spec: "RFC 9110", class: 3 },
  { code: 304, phrase: "Not Modified", description: "缓存新鲜，可继续使用缓存副本。", spec: "RFC 9110", class: 3 },
  { code: 307, phrase: "Temporary Redirect", description: "临时重定向，保持原方法。", spec: "RFC 9110", class: 3 },
  { code: 308, phrase: "Permanent Redirect", description: "永久重定向，保持原方法。", spec: "RFC 9110", class: 3 },
  // 4xx
  { code: 400, phrase: "Bad Request", description: "无效请求（语法/参数等问题）。", spec: "RFC 9110", class: 4 },
  { code: 401, phrase: "Unauthorized", description: "需要身份验证，通常配合 WWW-Authenticate。", spec: "RFC 9110", class: 4 },
  { code: 402, phrase: "Payment Required", description: "保留状态，未来可能用于付费相关。", spec: "RFC 9110", class: 4 },
  { code: 403, phrase: "Forbidden", description: "服务器理解请求但拒绝执行。", spec: "RFC 9110", class: 4 },
  { code: 404, phrase: "Not Found", description: "未找到资源或不公开存在性。", spec: "RFC 9110", class: 4 },
  { code: 405, phrase: "Method Not Allowed", description: "资源不支持该方法（Allow 指示支持的方法）。", spec: "RFC 9110", class: 4 },
  { code: 406, phrase: "Not Acceptable", description: "无法根据 Accept 头返回可接受的响应。", spec: "RFC 9110", class: 4 },
  { code: 407, phrase: "Proxy Authentication Required", description: "需要代理鉴权。", spec: "RFC 9110", class: 4 },
  { code: 408, phrase: "Request Timeout", description: "服务器等待请求超时。", spec: "RFC 9110", class: 4 },
  { code: 409, phrase: "Conflict", description: "请求与资源当前状态冲突。", spec: "RFC 9110", class: 4 },
  { code: 410, phrase: "Gone", description: "资源已永久不可用且无转发地址。", spec: "RFC 9110", class: 4 },
  { code: 411, phrase: "Length Required", description: "缺少 Content-Length。", spec: "RFC 9110", class: 4 },
  { code: 412, phrase: "Precondition Failed", description: "先决条件失败（If-* 头条件不满足）。", spec: "RFC 9110", class: 4 },
  { code: 413, phrase: "Content Too Large", description: "请求实体过大（原 Payload Too Large）。", spec: "RFC 9110", class: 4 },
  { code: 414, phrase: "URI Too Long", description: "URI 过长。", spec: "RFC 9110", class: 4 },
  { code: 415, phrase: "Unsupported Media Type", description: "不支持的媒体类型。", spec: "RFC 9110", class: 4 },
  { code: 416, phrase: "Range Not Satisfiable", description: "Range 请求范围不满足。", spec: "RFC 9110", class: 4 },
  { code: 417, phrase: "Expectation Failed", description: "Expect 头的期望无法满足。", spec: "RFC 9110", class: 4 },
  { code: 418, phrase: "I'm a teapot", description: "愚人节彩蛋（RFC 2324）。", spec: "RFC 2324", class: 4 },
  { code: 421, phrase: "Misdirected Request", description: "请求被定向到无法产生响应的服务器。", spec: "RFC 9110", class: 4 },
  { code: 422, phrase: "Unprocessable Content", description: "语义错误，服务器无法处理（WebDAV/通用）。", spec: "RFC 9110", class: 4 },
  { code: 423, phrase: "Locked", description: "资源被锁定（WebDAV）。", spec: "RFC 4918", class: 4 },
  { code: 424, phrase: "Failed Dependency", description: "依赖的请求失败（WebDAV）。", spec: "RFC 4918", class: 4 },
  { code: 425, phrase: "Too Early", description: "过早发送可能被重放的请求（HTTP/2 早期数据）。", spec: "RFC 8470", class: 4 },
  { code: 426, phrase: "Upgrade Required", description: "需要切换到更高协议版本。", spec: "RFC 9110", class: 4 },
  { code: 428, phrase: "Precondition Required", description: "必须使用条件请求以避免更新丢失。", spec: "RFC 6585", class: 4 },
  { code: 429, phrase: "Too Many Requests", description: "请求过于频繁（限流）。", spec: "RFC 6585", class: 4 },
  { code: 431, phrase: "Request Header Fields Too Large", description: "请求头字段过大。", spec: "RFC 6585", class: 4 },
  { code: 451, phrase: "Unavailable For Legal Reasons", description: "因法律原因不可用。", spec: "RFC 7725", class: 4 },
  // 5xx
  { code: 500, phrase: "Internal Server Error", description: "服务器内部错误。", spec: "RFC 9110", class: 5 },
  { code: 501, phrase: "Not Implemented", description: "未实现请求的方法。", spec: "RFC 9110", class: 5 },
  { code: 502, phrase: "Bad Gateway", description: "网关收到上游无效响应。", spec: "RFC 9110", class: 5 },
  { code: 503, phrase: "Service Unavailable", description: "服务不可用（临时过载/维护）。", spec: "RFC 9110", class: 5 },
  { code: 504, phrase: "Gateway Timeout", description: "网关等待上游超时。", spec: "RFC 9110", class: 5 },
  { code: 505, phrase: "HTTP Version Not Supported", description: "不支持的 HTTP 版本。", spec: "RFC 9110", class: 5 },
  { code: 506, phrase: "Variant Also Negotiates", description: "内部协商配置错误。", spec: "RFC 2295", class: 5 },
  { code: 507, phrase: "Insufficient Storage", description: "服务器无法存储完成请求所需的表示（WebDAV）。", spec: "RFC 4918", class: 5 },
  { code: 508, phrase: "Loop Detected", description: "检测到无限循环（WebDAV）。", spec: "RFC 5842", class: 5 },
  { code: 510, phrase: "Not Extended", description: "需进一步扩展才能完成请求。", spec: "RFC 2774", class: 5 },
  { code: 511, phrase: "Network Authentication Required", description: "需要网络身份验证（如登录门户）。", spec: "RFC 6585", class: 5 },
]

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

const CLASS_META: Record<HttpCode["class"], { label: string; color: string }> = {
  1: { label: "信息 1xx", color: "bg-sky-100 text-sky-700 border-sky-200" },
  2: { label: "成功 2xx", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  3: { label: "重定向 3xx", color: "bg-amber-100 text-amber-700 border-amber-200" },
  4: { label: "客户端错误 4xx", color: "bg-rose-100 text-rose-700 border-rose-200" },
  5: { label: "服务器错误 5xx", color: "bg-purple-100 text-purple-700 border-purple-200" },
}

// 常见状态码要点说明（可后续扩展）
const EXTRA: Record<number, string[]> = {
  200: ["幂等：取决于具体业务；GET 通常幂等，POST 不幂等", "缓存：结合 Cache-Control/Etag 使用"],
  201: ["应返回 Location 指向新资源", "常用于 POST 创建接口"],
  204: ["无响应体；前端不要解析 JSON", "常用于 PUT/DELETE 成功但无返回"],
  206: ["断点续传/分块下载；响应包含 Content-Range", "结合 Range 请求头使用"],
  301: ["永久重定向；SEO 友好", "推荐在服务端配置，保持方法与主体一致"],
  302: ["临时重定向；旧浏览器有 POST→GET 的历史兼容", "建议优先用 303/307"],
  303: ["建议用 GET 获取另一个 URI 的资源（适合表单提交后跳详情）"],
  304: ["命中缓存；响应无实体", "依赖 If-None-Match/If-Modified-Since 条件请求"],
  307: ["临时重定向；严格保持方法（POST 仍为 POST）"],
  308: ["永久重定向；严格保持方法"],
  400: ["请求无效：语法/参数/格式", "建议返回详细的错误字段提示"],
  401: ["需要认证；结合 WWW-Authenticate", "前端注意与 403 区分：401 是未认证/凭证失效"],
  403: ["已认证但无权限；或拒绝访问策略"],
  404: ["资源不存在或不公开存在性", "避免泄露敏感资源路径信息"],
  405: ["方法不被允许；返回 Allow 列出允许方法"],
  409: ["资源状态冲突（版本冲突/并发更新）", "可结合 ETag/If-Match 乐观锁"],
  410: ["资源已永久移除；比 404 更强语义"],
  412: ["先决条件失败；与 If-Match/If-Unmodified-Since 相关"],
  413: ["请求体过大；前后端约定最大限制并提示"],
  414: ["URI 过长；考虑改为 POST 或缩短查询参数"],
  415: ["媒体类型不支持；核对 Content-Type"],
  416: ["请求范围无效；检查 Range 与资源长度"],
  418: ["愚人节彩蛋；调试/示例使用，不用于生产"],
  429: ["限流；提供 Retry-After 指示重试时间"],
  500: ["服务器异常；记录错误日志并脱敏返回", "避免将堆栈信息直接暴露给客户端"],
  502: ["网关/反向代理上游错误", "经常与服务间网络/超时有关"],
  503: ["服务不可用；可带 Retry-After", "维护/过载时使用"],
  504: ["网关超时；检查上游服务响应时间与超时配置"],
}

export default function HttpStatusCodes() {
  const [q, setQ] = useState("")
  const [tab, setTab] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all")
  const { copied, copy } = useClipboard()
  const [open, setOpen] = useState<number | null>(null)

  const list = useMemo(() => {
    const text = q.trim().toLowerCase()
    let filtered = CODES
    if (tab !== "all") {
      const cls = Number(tab) as HttpCode["class"]
      filtered = filtered.filter(x => x.class === cls)
    }
    if (text) {
      const n = Number(text)
      filtered = filtered.filter(x =>
        x.code.toString().includes(text) ||
        x.phrase.toLowerCase().includes(text) ||
        x.description.toLowerCase().includes(text) ||
        (x.spec?.toLowerCase().includes(text) ?? false) ||
        (!Number.isNaN(n) && x.code === n)
      )
    }
    return filtered.sort((a, b) => a.code - b.code)
  }, [q, tab])

  return (
    <div className="w-full overflow-x-hidden">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            HTTP 状态码（最新）
            <Badge variant="secondary" className="ml-1">HTTP/1.1 · HTTP/2 · HTTP/3</Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            支持按状态码、短语、描述、RFC 关键字检索；默认分类展示常见状态码与含义。
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="min-w-0 flex-1 md:flex-[3] lg:flex-[4]">
              <Input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="搜索：如 404、Not Found、重定向、RFC 9110..."
                className="w-full h-8 text-base"
              />
            </div>
            <Tabs value={tab} onValueChange={(v)=>setTab(v as "all" | "1" | "2" | "3" | "4" | "5")} className="w-auto flex-none md:ml-auto">
              <TabsList className="whitespace-nowrap">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="1">1xx</TabsTrigger>
                <TabsTrigger value="2">2xx</TabsTrigger>
                <TabsTrigger value="3">3xx</TabsTrigger>
                <TabsTrigger value="4">4xx</TabsTrigger>
                <TabsTrigger value="5">5xx</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          <div className="space-y-2">
            {list.map((it) => {
              const isOpen = open === it.code
              return (
                <div
                  key={it.code}
                  className="rounded-md border p-3 bg-background/50"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    role="button"
                    onClick={() => setOpen(prev => (prev === it.code ? null : it.code))}
                  >
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className="font-mono text-lg font-semibold">{it.code}</span>
                      <Badge className={`border ${CLASS_META[it.class].color}`}>{CLASS_META[it.class].label}</Badge>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{it.phrase}</div>
                      <div className="text-xs text-muted-foreground">{it.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {it.spec && (
                        <a className="text-xs inline-flex items-center gap-1 text-primary underline" href={`https://www.rfc-editor.org/rfc/${(it.spec || "").toLowerCase().replace(" ", "")}.html`} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()}>
                          <LinkIcon className="w-3.5 h-3.5" /> {it.spec}
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={(e)=>{ e.stopPropagation(); copy(String(it.code)) }}>
                        {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}复制
                      </Button>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      {EXTRA[it.code]?.length ? (
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {EXTRA[it.code].map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground">暂无更多说明。建议结合具体业务理解，或查看下方 RFC。</div>
                      )}
                      {it.spec && (
                        <div className="mt-2 text-xs">
                          参考标准：
                          <a className="ml-1 inline-flex items-center gap-1 text-primary underline" href={`https://www.rfc-editor.org/rfc/${(it.spec || "").toLowerCase().replace(" ", "")}.html`} target="_blank" rel="noreferrer">
                            <LinkIcon className="w-3.5 h-3.5" /> {it.spec}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {!list.length && (
              <div className="text-center text-sm text-muted-foreground">未找到匹配项，试试更换关键词或切换分类。</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}