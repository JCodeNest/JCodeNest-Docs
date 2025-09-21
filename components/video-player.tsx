"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { getEmbedSrc, VideoResource } from "@/data/video-resources";

interface VideoPlayerProps {
  resource: VideoResource;
  className?: string;
  rounded?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  onDuration?: (seconds: number) => void; // 元数据加载后上报时长（仅直链）
}

export default function VideoPlayer({
  resource,
  className,
  rounded = "rounded-xl",
  controls = true,
  autoPlay = false,
  muted = false,
  playsInline = true,
  onDuration,
}: VideoPlayerProps) {
  if (resource.platform === "direct" && resource.source.type === "file") {
    return (
      <AspectRatio ratio={16 / 9} className={cn("w-full", className)}>
        <video
          className={cn("h-full w-full object-cover", rounded)}
          src={resource.source.url}
          poster={resource.thumbnail}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const s = e.currentTarget.duration;
            if (!isNaN(s) && onDuration) {
              onDuration(s);
            }
          }}
        />
      </AspectRatio>
    );
  }

  const embed = getEmbedSrc(resource);
  return (
    <AspectRatio ratio={16 / 9} className={cn("w-full", className)}>
      <iframe
        src={embed}
        title={resource.title}
        className={cn("h-full w-full", rounded)}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </AspectRatio>
  );
}