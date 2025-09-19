import { NextResponse } from "next/server"

function absolutize(base: string, href: string | null | undefined): string | undefined {
  if (!href) return undefined
  try {
    return new URL(href, base).toString()
  } catch {
    return undefined
  }
}

// 朴素解析：从 HTML 中提取 title、description、icon
function parseHead(html: string, baseUrl: string) {
  const pick = (re: RegExp) => {
    const m = html.match(re)
    return m?.[1]?.trim()
  }

  const title =
    pick(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    pick(/<meta[^>]+name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    pick(/<title[^>]*>([^<]+)<\/title>/i)

  const description =
    pick(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    pick(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    pick(/<meta[^>]+name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)

  // 尝试多种 icon
  const iconHref =
    pick(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
    pick(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
    "/favicon.ico"

  const icon = absolutize(baseUrl, iconHref)

  return { title, description, icon }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get("url")
  if (!target) {
    return NextResponse.json({ error: "missing url" }, { status: 400 })
  }
  try {
    // 先请求 HTML
    const res = await fetch(target, { redirect: "follow" })
    const finalUrl = res.url || target
    const contentType = res.headers.get("content-type") || ""
    if (/json/i.test(contentType)) {
      const data = await res.json().catch(() => undefined)
      return NextResponse.json({
        title: data?.title ?? new URL(finalUrl).hostname,
        description: data?.description ?? "",
        icon: absolutize(finalUrl, "/favicon.ico"),
      })
    }
    const html = await res.text()
    const meta = parseHead(html, finalUrl)
    return NextResponse.json(meta)
  } catch (e) {
    try {
      return NextResponse.json({
        title: new URL(target).hostname,
        description: "",
        icon: absolutize(target, "/favicon.ico"),
      })
    } catch {
      return NextResponse.json({ error: "bad url" }, { status: 400 })
    }
  }
}