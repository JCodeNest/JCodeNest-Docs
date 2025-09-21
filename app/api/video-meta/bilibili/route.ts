import { NextRequest } from "next/server";

export const revalidate = 60 * 60; // 1h 缓存

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bvid = searchParams.get("bvid");
    const pageRaw = searchParams.get("page");
    const page = Math.max(1, Number(pageRaw || "1"));

    if (!bvid) {
      return new Response(JSON.stringify({ error: "missing bvid" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const api = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(
      bvid
    )}`;

    const res = await fetch(api, {
      // 使用 Next 内置缓存，配合 revalidate
      next: { revalidate },
      headers: {
        // 设定 UA 提高成功率（可选）
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "upstream_failed" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const json = await res.json();
    const data = json?.data;
    const pic: string | undefined = data?.pic;
    // 总时长（秒），多 P 时 pages[page-1].duration 更准确
    let duration: number | undefined = data?.duration;
    if (Array.isArray(data?.pages) && data.pages.length >= page) {
      const p = data.pages[page - 1];
      if (typeof p?.duration === "number") {
        duration = p.duration;
      }
    }

    return new Response(JSON.stringify({ pic, duration }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unexpected_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}