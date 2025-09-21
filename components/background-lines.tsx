import React from "react";
import { BackgroundLines } from "@/components/ui/background-lines";
import { siteConfig } from "@/config/site";

export function BackgroundLinesCard() {
  return (
    <BackgroundLines className="flex items-center justify-center w-full h-full flex-col px-4 rounded-lg">
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-xl md:text-3xl lg:text-5xl font-sans py-2 md:py-6 relative z-20 font-bold tracking-tight">
        {siteConfig.home.heroTitle}
      </h2>
      <p className="max-w-xl mx-auto text-sm md:text-base text-neutral-700 dark:text-neutral-400 text-center">
        {siteConfig.home.heroDescription}
      </p>
    </BackgroundLines>
  );
}
