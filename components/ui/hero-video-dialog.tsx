"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Play, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out";

interface HeroVideoProps {
  animationStyle?: AnimationStyle;
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  className?: string;
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

export function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const selectedAnimation = animationVariants[animationStyle];

  useEffect(() => {
    setMounted(true);
  }, []);

  // 当缩略图地址变化时重置加载状态，避免保持隐藏
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [thumbnailSrc]);

  // 弹层内容（通过 Portal 渲染到 body，避免被祖先 overflow/filter 限制）
  const modal = (
    <AnimatePresence>
      {isVideoOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
              setIsVideoOpen(false);
            }
          }}
          onClick={() => setIsVideoOpen(false)}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            {...selectedAnimation}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative mx-4 aspect-video w-full max-w-5xl md:mx-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-14 right-0 rounded-full bg-neutral-900/60 p-2 text-xl text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-neutral-900/80 dark:bg-neutral-100/60 dark:text-black"
            >
              <XIcon className="size-5" />
            </button>
            <div className="relative isolate z-[1] size-full overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              <iframe
                src={videoSrc}
                title="Hero Video player"
                className="size-full rounded-2xl"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Play video"
        onClick={() => setIsVideoOpen(true)}
        className="group relative block w-full h-full cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0"
      >
        <div className="relative w-full h-full">
          {/* 骨架：仅在未加载或出错时渲染，避免闪烁 */}
          {(!imgLoaded || imgError) && (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-muted"
            />
          )}

          {/* 缩略图：加载成功后显示，失败则保持隐藏 */}
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={thumbnailAlt}
              width={1920}
              height={1080}
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{ visibility: imgLoaded && !imgError ? "visible" : "hidden" }}
              className="block h-full w-full object-cover"
            />
          ) : null}

          {/* 中心播放按钮 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex size-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md">
              <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-b from-primary/30 to-primary shadow-md transition-transform duration-200 ease-out group-hover:scale-[1.08]">
                <Play
                  className="size-8 fill-white text-white"
                  style={{ filter: "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))" }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>
      {mounted ? createPortal(modal, document.body) : null}
    </div>
  );
}
