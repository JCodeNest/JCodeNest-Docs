"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, ImageDown, FileDown, Upload, Save, AlertCircle } from "lucide-react";
import "@excalidraw/excalidraw/index.css";

// 动态加载 Excalidraw，避免 SSR 报错
const ExcalidrawLazy = dynamic(async () => {
  const mod = await import("@excalidraw/excalidraw");
  return mod.Excalidraw;
}, {
  ssr: false,
  loading: () => (
    <div className="flex h-[50vh] items-center justify-center text-sm text-muted-foreground">
      正在加载 Excalidraw…
    </div>
  ),
});

type SceneSnapshot = {
  elements: readonly any[];
  appState: any;
  files: Record<string, any>;
};

const LS_KEY = "excalidraw:auto-save";

export default function ExcalidrawClient() {
  const [busy, setBusy] = React.useState<null | "png" | "svg" | "json">(null);
  const [transparent, setTransparent] = React.useState<boolean>(false);
  const [customW, setCustomW] = React.useState<string>("");
  const [customH, setCustomH] = React.useState<string>("");
  const [autoSave, setAutoSave] = React.useState<boolean>(false);
  const [dirty, setDirty] = React.useState<boolean>(false);

  const sceneRef = React.useRef<SceneSnapshot | null>(null);
  const apiRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // 初始化读取 LocalStorage 开关
  React.useEffect(() => {
    try {
      const flag = localStorage.getItem(LS_KEY + ":enabled");
      setAutoSave(flag === "1");
    } catch {}
  }, []);

  // 离开前提示（仅当未开启自动保存 且 有内容）
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasContent = (sceneRef.current?.elements?.length ?? 0) > 0;
      if (!autoSave && hasContent && dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [autoSave, dirty]);

  // 自动保存
  const persistIfNeeded = React.useCallback(() => {
    if (!autoSave) return;
    try {
      const scene = sceneRef.current;
      if (!scene) return;
      const { collaborators: _ignored, ...restAppState } = (scene as any).appState || {};
      const payload = {
        elements: scene.elements,
        appState: restAppState,
        // 这里不保存 files（图片资源），保证简单可靠
      };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {}
  }, [autoSave]);

  // 自动加载（当开启开关时）
  React.useEffect(() => {
    if (!autoSave) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // 需要 API 来更新场景
      if (apiRef.current && parsed?.elements && parsed?.appState) {
        apiRef.current.updateScene({
          elements: parsed.elements,
          appState: normalizeAppState(parsed.appState),
        });
      }
    } catch {}
  }, [autoSave]);

  // 导出通用下载
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const calcDimensions = (width: number, height: number) => {
    const W = parseInt(customW || "", 10);
    const H = parseInt(customH || "", 10);
    if (!isNaN(W) && W > 0 && !isNaN(H) && H > 0) return { width: W, height: H };
    if (!isNaN(W) && W > 0) return { width: W, height: Math.round((height / width) * W) };
    if (!isNaN(H) && H > 0) return { width: Math.round((width / height) * H), height: H };
    return { width, height };
  };

  // 规范化 appState：确保 collaborators 为 Map，避免 forEach 报错
  const normalizeAppState = (input: any) => {
    const { collaborators: _ignored, ...rest } = input || {};
    return { ...rest, collaborators: new Map() };
  };

  const handleExportPNG = async () => {
    setBusy("png");
    try {
      const scene = sceneRef.current;
      if (!scene) return;
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements: scene.elements,
        appState: {
          ...scene.appState,
          exportWithDarkMode: false,
          exportBackground: !transparent,
        },
        files: scene.files,
        mimeType: "image/png",
        quality: 1,
        maxWidthOrHeight: 4096,
        getDimensions: (w: number, h: number) => calcDimensions(w, h),
      });
      downloadBlob(blob, `excalidraw-${Date.now()}.png`);
      setDirty(false);
    } finally {
      setBusy(null);
    }
  };

  const handleExportSVG = async () => {
    setBusy("svg");
    try {
      const scene = sceneRef.current;
      if (!scene) return;
      const { exportToSvg } = await import("@excalidraw/excalidraw");
      const svg = await exportToSvg({
        elements: scene.elements,
        appState: scene.appState,
        files: scene.files,
      });
      const blob = new Blob(
        [new XMLSerializer().serializeToString(svg)],
        { type: "image/svg+xml" }
      );
      downloadBlob(blob, `excalidraw-${Date.now()}.svg`);
      setDirty(false);
    } finally {
      setBusy(null);
    }
  };

  const handleExportJSON = async () => {
    setBusy("json");
    try {
      const scene = sceneRef.current;
      if (!scene) return;
      const payload = {
        type: "excalidraw",
        version: 2,
        source: "JCodeNest-Docs",
        elements: scene.elements,
        appState: scene.appState,
        files: scene.files,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      downloadBlob(blob, `excalidraw-${Date.now()}.excalidraw`);
      setDirty(false);
    } finally {
      setBusy(null);
    }
  };

  const handleClickImport = () => fileInputRef.current?.click();

  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = ""; // 允许再次选择同一文件
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (apiRef.current && data?.elements && data?.appState) {
        apiRef.current.updateScene({
          elements: data.elements,
          appState: normalizeAppState(data.appState),
          // files 可选
        });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleClickImport} disabled={busy !== null}>
            <Upload className="mr-2 h-4 w-4" /> 导入工程
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPNG} disabled={busy !== null}>
            <ImageDown className="mr-2 h-4 w-4" /> 导出 PNG
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportSVG} disabled={busy !== null}>
            <FileDown className="mr-2 h-4 w-4" /> 导出 SVG
          </Button>
          <Button size="sm" onClick={handleExportJSON} disabled={busy !== null}>
            <Download className="mr-2 h-4 w-4" /> 导出工程(.excalidraw)
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-primary"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
              />
              透明背景
            </label>
            <label className="flex items-center gap-1 text-xs">
              宽
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-7 w-20 rounded border bg-background px-2 text-xs"
                placeholder="auto"
                value={customW}
                onChange={(e) => setCustomW(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className="flex items-center gap-1 text-xs">
              高
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-7 w-20 rounded border bg-background px-2 text-xs"
                placeholder="auto"
                value={customH}
                onChange={(e) => setCustomH(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-primary"
                checked={autoSave}
                onChange={(e) => {
                  const v = e.target.checked;
                  setAutoSave(v);
                  try {
                    localStorage.setItem(LS_KEY + ":enabled", v ? "1" : "0");
                  } catch {}
                }}
              />
              自动保存到本地
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          无后端持久化：请在退出前导出到本地。若开启自动保存，将仅保存基础图形到浏览器本地（不含外链图片资源）。
        </div>
      </Card>

      <Separator />

      <input
        ref={fileInputRef}
        type="file"
        accept=".excalidraw,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="h-[calc(100vh-260px)] min-h-[420px] w-full overflow-hidden rounded-md border">
        <ExcalidrawLazy
          UIOptions={{
            canvasActions: {
              loadScene: true,
              saveToActiveFile: false,
              export: false,
            },
          }}
          excalidrawAPI={(api: any) => {
            apiRef.current = api;
          }}
          onChange={(
            elements: readonly any[],
            appState: any,
            files: Record<string, any>
          ) => {
            sceneRef.current = { elements, appState, files };
            setDirty(true);
            persistIfNeeded();
          }}
        />
      </div>
    </div>
  );
}