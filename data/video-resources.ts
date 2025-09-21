export type VideoPlatform = "direct" | "youtube" | "bilibili";

export interface BilibiliMeta {
  bvid?: string;
  aid?: string;
  cid?: string;
  page?: number;
  rawIframeSrc?: string; // 如果直接提供官方 iframe 的 src，将优先使用
}

export interface VideoResource {
  id: string;
  title: string;
  description?: string;
  categories: string[]; // 例如：["Java", "Spring", "基础"]
  tags: string[]; // 例如：["入门","并发"]
  platform: VideoPlatform;
  thumbnail?: string; // 缩略图 URL（可选，若未提供则自动推断）
  originalUrl?: string; // 原页面地址
  publishedAt?: string; // ISO 字符串或 "YYYY-MM-DD"
  // 源定义
  source:
    | { type: "embed"; url: string } // 已是可直接嵌入的 iframe src（主要用于 YouTube）
    | { type: "file"; url: string } // 直链视频文件
    | { type: "bilibili"; meta: BilibiliMeta }; // B站信息
}

// 生成可嵌入播放的 iframe src（用于 HeroVideoDialog 和 iframe 播放）
export function getEmbedSrc(resource: VideoResource): string {
  if (resource.platform === "direct") {
    // 直链视频文件使用 <video> 播放，不返回 iframe src
    return "";
  }

  if (resource.platform === "youtube") {
    if (resource.source.type === "embed") {
      const url = new URL(resource.source.url, "https://www.youtube.com");
      if (!url.searchParams.has("rel")) url.searchParams.set("rel", "0");
      if (!url.searchParams.has("modestbranding"))
        url.searchParams.set("modestbranding", "1");
      if (!url.searchParams.has("playsinline"))
        url.searchParams.set("playsinline", "1");
      return url.toString();
    }
    return "";
  }

  if (resource.platform === "bilibili") {
    if (resource.source.type === "bilibili") {
      const meta = resource.source.meta;
      if (meta.rawIframeSrc) {
        const url = meta.rawIframeSrc.startsWith("//")
          ? "https:" + meta.rawIframeSrc
          : meta.rawIframeSrc;
        return url;
      }
      const base = "https://player.bilibili.com/player.html";
      const params = new URLSearchParams();
      params.set("isOutside", "true");
      if (meta.bvid) params.set("bvid", meta.bvid);
      if (meta.aid) params.set("aid", meta.aid);
      if (meta.cid) params.set("cid", meta.cid);
      if (meta.page) params.set("p", String(meta.page));
      return `${base}?${params.toString()}`;
    }
    return "";
  }

  return "";
}

// 根据资源推断缩略图：优先使用 resource.thumbnail；其次对 YouTube 自动生成
export function getThumbnailSrc(resource: VideoResource): string {
  if (resource.thumbnail) return resource.thumbnail;

  if (resource.platform === "youtube") {
    // 从 embed 链接中提取视频 ID：.../embed/{VIDEO_ID}
    if (resource.source.type === "embed") {
      try {
        const u = new URL(resource.source.url, "https://www.youtube.com");
        const m = u.pathname.match(/\/embed\/([^\/?]+)/);
        const vid = m?.[1];
        if (vid) return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      } catch {
        // ignore
      }
    }
  }

  // 其它平台无法通用推断时返回空字符串（可由前端做占位）
  return "";
}

// 约定式视频资源清单：可按需扩充
export const videoResources: VideoResource[] = [
  {
    id: "things-you-said",
    title: "Things You Said (Acoustic Sessions / Traditional Chinese) ft. Abby Cates",
    description: "Listen to “Things You Said (Acoustic  Version)” feat. Abby Cates everywhere music is consumed: https://CodyFry.lnk.to/ThingsYouSaidA...",
    categories: ["Music"],
    tags: ["English", "Music"],
    platform: "youtube",
    // 未显式给出 thumbnail，渲染时将自动推断
    originalUrl: "https://www.youtube.com/embed/WVD1EBLpWMQ?si=g3tghnrCEjRCEw-t",
    source: {
      type: "embed",
      url: "https://www.youtube.com/embed/WVD1EBLpWMQ?si=g3tghnrCEjRCEw-t",
    },
  },
  {
    id: "java-8",
    title: "【零基础 快速学Java】韩顺平 零基础30天学会Java",
    description: "本教程全面讲解了Java基础的方方面面。每一个知识点都讲解的非常细致，通俗易懂。",
    categories: ["Java"],
    tags: ["B站", "JDK", "入门"],
    platform: "bilibili",
    originalUrl: "https://www.bilibili.com/video/BV1fh411y7R8/?spm_id_from=333.337.search-card.all.click&vd_source=e288c7fccfa638f8b59eb32d76842e08",
    source: {
      type: "bilibili",
      meta: {
        bvid: "BV1fh411y7R8",
        cid: "299710389",
        page: 1
      },
    },
  }
];

// 常见分类与平台枚举，方便页面筛选
export const VIDEO_CATEGORIES: string[] = Array.from(
  new Set(videoResources.flatMap((v) => v.categories))
).sort();

export const VIDEO_TAGS: string[] = Array.from(
  new Set(videoResources.flatMap((v) => v.tags))
).sort();

export const VIDEO_PLATFORMS: VideoPlatform[] = ["direct", "youtube", "bilibili"];