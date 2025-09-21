"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export interface TagCloudProps {
  tags: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

export default function TagCloud({ tags, selected, onChange, className }: TagCloudProps) {
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return tags;
    return tags.filter(t => t.toLowerCase().includes(k));
  }, [q, tags]);

  const toggle = (t: string) => {
    const exists = selected.includes(t);
    const next = exists ? selected.filter(x => x !== t) : [...selected, t];
    onChange(next);
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every(t => selected.includes(t));
  const anySelected = selected.length > 0;

  const selectAllVisible = () => {
    // 将当前可见标签与已选合并
    const set = new Set([...selected, ...filtered]);
    onChange(Array.from(set));
  };

  const clearAll = () => onChange([]);

  return (
    <div className={className}>
      {/* 搜索框 */}
      <div className="p-2">
        <input
          type="text"
          placeholder="过滤标签…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full h-8 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* 批量操作 */}
      <div className="flex items-center justify-between px-2 pb-2 text-xs text-muted-foreground">
        <div>共 {tags.length} 个标签{q ? `，匹配 ${filtered.length}` : ""}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hover:text-foreground"
            onClick={selectAllVisible}
            disabled={filtered.length === 0 || allVisibleSelected}
            title="全选当前可见"
          >
            全选可见
          </button>
          <span className="text-muted-foreground/50">·</span>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={clearAll}
            disabled={!anySelected}
            title="清空已选"
          >
            清空
          </button>
        </div>
      </div>

      {/* 标签云 */}
      <div className="px-2 pb-2 max-h-72 overflow-auto">
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">无匹配标签</div>
        ) : (
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(96px,1fr))] gap-2">
            {filtered.map((t) => {
              const checked = selected.includes(t);
              return (
                <label
                  key={t}
                  className={`group inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs cursor-pointer transition-colors ${
                    checked ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(t)}
                    className={`size-3.5 ${checked ? "data-[state=checked]:bg-white data-[state=checked]:text-primary" : ""}`}
                  />
                  <span className="truncate">{t}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}