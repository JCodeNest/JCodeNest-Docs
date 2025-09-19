"use client";

import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

export function ThreeDCard() {
  return (
    <CardContainer className="inter-var w-full h-full">
      <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-full rounded-xl p-6 border flex flex-col">
        <CardItem
          translateZ="50"
          className="text-xl md:text-2xl font-bold text-neutral-600 dark:text-white"
        >
          3D 交互体验
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-base md:text-lg mt-3 dark:text-neutral-300 flex-1"
        >
          悬停体验 CSS 3D 变换的魅力
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4 flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="w-full h-40 md:h-48 object-cover rounded-lg group-hover/card:shadow-xl"
            alt="thumbnail"
          />
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
