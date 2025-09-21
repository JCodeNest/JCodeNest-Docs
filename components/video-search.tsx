"use client";

import * as React from "react";
import { useDebounce } from "use-debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { SidebarGroup, SidebarGroupContent, SidebarInput } from "@/components/ui/sidebar";
import { Hash, PlayCircle, Youtube, TvMinimal } from "lucide-react";
import type { VideoResource, VideoPlatform } from "@/data/video-resources";

export interface VideoSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  platform: VideoPlatform;
  categories: string[];
  tags: string[];
}

interface VideoSearchProps {
  resources: VideoResource[];
  onResultsChange?: (results: VideoResource[]) => void;
  onSelect?: (resource: VideoResource) => void;
  placeholder?: string;
}

function tokenize(q: string) {
  return q
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// 简单过滤：支持关键词匹配 title/description/tags/categories
// 支持过滤语法：tag:xxx cat:xxx platform:youtube|bilibili|direct
function filterResources(resources: VideoResource[], query: string): VideoResource[] {
  const tokens = tokenize(query.toLowerCase());
  if (tokens.length === 0) return resources;

  let platformFilter: VideoPlatform | undefined;
  const tagFilters: string[] = [];
  const catFilters: string[] = [];
  const keywords: string[] = [];

  for (const t of tokens) {
    if (t.startsWith("platform:")) {
      const p = t.replace("platform:", "") as VideoPlatform;
      platformFilter = ["direct", "youtube", "bilibili"].includes(p) ? p : undefined;
    } else if (t.startsWith("tag:")) {
      tagFilters.push(t.replace("tag:", ""));
    } else if (t.startsWith("cat:") || t.startsWith("category:")) {
      catFilters.push(t.replace(/^cat:|^category:/, ""));
    } else {
      keywords.push(t);
    }
  }

  return resources.filter((r) => {
    if (platformFilter && r.platform !== platformFilter) return false;

    if (tagFilters.length > 0) {
      const hayTags = r.tags.map((x) => x.toLowerCase());
      const hitAllTags = tagFilters.every((t) => hayTags.includes(t));
      if (!hitAllTags) return false;
    }

    if (catFilters.length > 0) {
      const hayCats = r.categories.map((x) => x.toLowerCase());
      const hitAllCats = catFilters.every((c) => hayCats.includes(c));
      if (!hitAllCats) return false;
    }

    if (keywords.length > 0) {
      const hay = [r.title, r.description ?? "", ...r.tags, ...r.categories]
        .join(" ")
        .toLowerCase();
      return keywords.every((k) => hay.includes(k));
    }

    return true;
  });
}

export default function VideoSearch({
  resources,
  onResultsChange,
  onSelect,
  placeholder = "搜索视频（支持 tag: 和 cat: 以及 platform:youtube/bilibili/direct）…",
}: VideoSearchProps) {
  const [query, setQuery] = React.useState("");
  const [debouncedQuery] = useDebounce(query, 250);
  const [results, setResults] = React.useState<VideoResource[]>(resources);
  const [focused, setFocused] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [expanded, setExpanded] = React.useState(false);
  const LIMIT = 10;

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // 外部点击关闭浮层
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setFocused(false);
        setActiveIndex(-1);
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 过滤与联动输出
  React.useEffect(() => {
    const filtered = filterResources(resources, debouncedQuery);
    setResults(filtered);
    onResultsChange?.(filtered);
    setIsLoading(false);
    setActiveIndex(filtered.length > 0 ? 0 : -1);
  }, [resources, debouncedQuery, onResultsChange]);

  const handleSelect = (id: string) => {
    const r = resources.find((x) => x.id === id);
    if (r) onSelect?.(r);
    setFocused(false);
    setActiveIndex(-1);
  };

  // 用于命中词高亮（忽略 tag:/cat:/platform:）
  const highlightTokens = React.useMemo(() => {
    return tokenize(query.toLowerCase()).filter(
      (t) =>
        !(
          t.startsWith("tag:") ||
          t.startsWith("cat:") ||
          t.startsWith("category:") ||
          t.startsWith("platform:")
        )
    );
  }, [query]);

  function highlight(text: string): React.ReactNode {
    if (!text || highlightTokens.length === 0) return text;
    const escaped = highlightTokens.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`(${escaped.join("|")})`, "ig");
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const start = m.index;
      const end = regex.lastIndex;
      if (start > lastIndex) parts.push(text.slice(lastIndex, start));
      parts.push(
        <mark key={start} className="rounded bg-yellow-200/70 px-0.5">
          {text.slice(start, end)}
        </mark>
      );
      lastIndex = end;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return <>{parts}</>;
  }

  const displayed = React.useMemo(
    () => (expanded ? results : results.slice(0, LIMIT)),
    [results, expanded]
  );

  return (
    <div ref={containerRef}>
      <form onSubmit={(e) => e.preventDefault()}>
        <SidebarGroup className="py-0 mt-2">
          <SidebarGroupContent className="relative">
            <Label htmlFor="video-search" className="sr-only">
              搜索视频
            </Label>
            <SidebarInput
              id="video-search"
              placeholder={placeholder}
              className="pl-8"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsLoading(true);
                setFocused(true);
              }}
              onFocus={() => setFocused(true)}
              onKeyDown={(e) => {
                if (!displayed.length) {
                  if (e.key === "Escape") setFocused(false);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, displayed.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const target = displayed[activeIndex];
                  if (target) handleSelect(target.id);
                } else if (e.key === "Escape") {
                  setFocused(false);
                  setActiveIndex(-1);
                }
              }}
            />
            <PlayCircle className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />

            {/* 浮层结果面板 */}
            {(focused || debouncedQuery.length > 0) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                <div className="max-h-80 overflow-auto">
                  <Command shouldFilter={false}>
                    <CommandList>
                      {/* 加载骨架 */}
                      {isLoading && (
                        <div className="px-3 py-3 space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                          ))}
                        </div>
                      )}

                      {/* 空态 */}
                      {!isLoading && debouncedQuery && results.length === 0 && (
                        <CommandEmpty className="px-3 py-4 text-sm text-muted-foreground">
                          没有匹配的视频
                        </CommandEmpty>
                      )}

                      {/* 结果 */}
                      {!isLoading && results.length > 0 && (
                        <>
                          <CommandGroup heading="匹配结果">
                            {displayed.map((r, idx) => (
                              <CommandItem
                                key={r.id}
                                value={`${r.title}-${r.id}`}
                                onSelect={() => handleSelect(r.id)}
                                className={`flex items-start gap-2 ${
                                  idx === activeIndex ? "bg-accent text-accent-foreground" : ""
                                }`}
                                // 鼠标移动也更新高亮
                                onMouseMove={() => setActiveIndex(idx)}
                              >
                                {r.platform === "youtube" ? (
                                  <Youtube className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                ) : r.platform === "bilibili" ? (
                                  <TvMinimal className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{highlight(r.title)}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {highlight(r.description ?? "")}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-1">
                                    {r.categories.join(" / ")} · {r.tags.join(", ")}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>

                          {/* 查看全部 */}
                          {results.length > LIMIT && !expanded && (
                            <div className="px-3 py-2 text-center">
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline"
                                onClick={() => setExpanded(true)}
                              >
                                查看全部 {results.length} 条结果
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* 无输入提示 */}
                      {!isLoading && !debouncedQuery && (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          输入关键词，或使用过滤：tag:并发 cat:java platform:bilibili
                        </div>
                      )}
                    </CommandList>
                  </Command>
                </div>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </form>
    </div>
  );
}