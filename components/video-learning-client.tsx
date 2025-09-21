"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { PlayCircle, ChevronDown, Check, Youtube, TvMinimal, Hash } from "lucide-react";
import VideoSearch from "@/components/video-search";
import VideoPlayer from "@/components/video-player";
import {
  videoResources,
  VIDEO_CATEGORIES,
  VIDEO_TAGS,
  VIDEO_PLATFORMS,
  getEmbedSrc,
  getThumbnailSrc,
  type VideoResource,
  type VideoPlatform,
} from "@/data/video-resources";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TagCloud from "@/components/tag-cloud";

function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return "";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function VideoLearningClient() {
  // 搜索结果（仅关键词过滤后的集合）
  const [filteredBySearch, setFilteredBySearch] = useState<VideoResource[]>(videoResources);

  // 右侧筛选状态
  const [category, setCategory] = useState<string>("全部");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [platform, setPlatform] = useState<VideoPlatform | "全部">("全部");

  // 直链/平台自动补充的时长（秒）与封面
  const [durMap, setDurMap] = useState<Record<string, number>>({});
  const [thumbMap, setThumbMap] = useState<Record<string, string>>({});

  const categories = useMemo(() => ["全部", ...VIDEO_CATEGORIES], []);
  const tags = useMemo(() => VIDEO_TAGS, []);
  const platforms = useMemo(() => ["全部", ...VIDEO_PLATFORMS] as (VideoPlatform | "全部")[], []);

  // 叠加筛选（分类/标签/平台）得到最终可见列表
  const visibleList = useMemo(() => {
    return filteredBySearch.filter((r) => {
      if (category !== "全部" && !r.categories.includes(category)) return false;
      if (platform !== "全部" && r.platform !== platform) return false;
      if (selectedTags.length > 0) {
        const lower = r.tags.map((t) => t.toLowerCase());
        const anyHit = selectedTags.some((t) => lower.includes(t.toLowerCase()));
        if (!anyHit) return false;
      }
      return true;
    });
  }, [filteredBySearch, category, platform, selectedTags]);

  // 标签多选切换
  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  // 平台图标
  const PlatformIcon: React.FC<{ p: VideoPlatform }> = ({ p }) =>
    p === "youtube" ? (
      <Youtube className="h-3.5 w-3.5" />
    ) : p === "bilibili" ? (
      <TvMinimal className="h-3.5 w-3.5" />
    ) : (
      <Hash className="h-3.5 w-3.5" />
    );

  // 可见列表中的 B 站缺省封面/时长自动补齐
  useEffect(() => {
    const tasks = visibleList
      .filter((r) => r.platform === "bilibili" && r.source.type === "bilibili")
      .filter((r) => !thumbMap[r.id] || !durMap[r.id]);

    tasks.forEach((r) => {
      const { bvid, page } = r.source.type === "bilibili" ? r.source.meta : {};
      if (!bvid) return;
      const p = page ?? 1;
      fetch(`/api/video-meta/bilibili?bvid=${encodeURIComponent(bvid)}&page=${p}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          if (data.pic && !thumbMap[r.id]) {
            const pic = String(data.pic).startsWith("http://")
              ? String(data.pic).replace(/^http:\/\//, "https://")
              : String(data.pic);
            setThumbMap((prev) => ({ ...prev, [r.id]: pic }));
          }
          if (typeof data.duration === "number" && !durMap[r.id]) {
            setDurMap((prev) => ({ ...prev, [r.id]: data.duration as number }));
          }
        })
        .catch(() => {});
    });
  }, [visibleList, thumbMap, durMap]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 顶部工具栏：左侧搜索，右侧分类/标签/平台下拉 */}
      <div className="flex items-center gap-2 w-full flex-wrap">
        {/* 左侧搜索框 */}
        <div className="w-full sm:w-auto sm:flex-1 min-w-[220px] max-w-md">
          <VideoSearch
            resources={videoResources}
            onResultsChange={setFilteredBySearch}
          />
        </div>

        {/* 右侧筛选组 */}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* 分类（单选） */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="inline-flex items-center gap-1">
                分类：{category}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>选择分类</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 标签（多选，标签云） */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="inline-flex items-center gap-1">
                标签{selectedTags.length > 0 ? `（${selectedTags.length}）` : ""}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-0 w-[min(80vw,320px)]">
              <DropdownMenuLabel className="px-3 py-2">选择标签（可多选）</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <TagCloud
                tags={tags}
                selected={selectedTags}
                onChange={setSelectedTags}
                className="pt-0"
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 平台（单选） */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="inline-flex items-center gap-1">
                平台：{platform === "全部" ? "全部" : platform}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>选择平台</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {platforms.map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => setPlatform(p as VideoPlatform | "全部")}
                >
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 视频卡片列表 */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {visibleList.map((r) => {
          const embed = getEmbedSrc(r);
          const thumb = thumbMap[r.id] || getThumbnailSrc(r) || r.thumbnail || "/og.png";
          const dur = durMap[r.id] ? formatDuration(durMap[r.id]) : "";
          return (
            <Card
              key={r.id}
              className="group overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm"
            >
              <CardContent className="p-0">
                {/* 预览图 + 弹出播放（16:9 + 渐变遮罩） */}
                <AspectRatio
                  ratio={16 / 9}
                  className="relative overflow-hidden rounded-t-xl [&_button]:absolute [&_button]:inset-0 [&_button]:m-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:rounded-none [&_img]:border-0 [&_img]:shadow-none"
                >
                  <HeroVideoDialog
                    className="block h-full w-full"
                    animationStyle="from-center"
                    videoSrc={embed || ""}
                    thumbnailSrc={thumb}
                    thumbnailAlt={r.title}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 text-white px-2.5 py-0.5 text-xs">
                        <PlatformIcon p={r.platform} />
                        {r.platform}
                      </span>
                    </div>
                    {dur && (
                      <span className="rounded-full bg-black/60 text-white px-2.5 py-0.5 text-xs">
                        {dur}
                      </span>
                    )}
                  </div>
                </AspectRatio>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium line-clamp-2 flex-1">
                      {r.title}
                    </h3>
                    {r.originalUrl && (
                      <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <a
                          href={r.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          源站点
                        </a>
                      </Button>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {r.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.tags.slice(0, 4).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}