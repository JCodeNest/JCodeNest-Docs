import { BoxReveal } from "@/components/ui/box-reveal";

export function BoxRevealCard() {
  return (
    <div className="size-full max-w-lg items-center justify-center overflow-hidden">
      <BoxReveal boxColor={"oklch(48.8% 0.243 264.376)"} duration={0.5}>
        <p className="text-[3.5rem] font-semibold">
          JCodeNest<span className="text-[oklch(48.8% 0.243 264.376)]">.</span>
        </p>
      </BoxReveal>

      <BoxReveal boxColor={"oklch(48.8% 0.243 264.376)"} duration={0.5}>
        <h2 className="mt-[.5rem] text-[1rem]">
          一个会写代码的{" "}
          <span className="text-[oklch(48.8% 0.243 264.376)]">干饭工程师</span>
        </h2>
      </BoxReveal>

      <BoxReveal boxColor={"#5046e6"} duration={0.5}>
        <div className="mt-6">
          <p>
            -&gt; 专治各种疑难杂症，精通
            <span className="font-semibold text-[oklch(48.8% 0.243 264.376)]"> 前端</span>、
            <span className="font-semibold text-[oklch(48.8% 0.243 264.376)]">后端 </span>
            和
            <span className="font-semibold text-[oklch(48.8% 0.243 264.376)]"> 摸鱼</span>
            技术 <br />
            -&gt; 代码能跑就是艺术，Bug多了就是特性 🐛 <br />
            -&gt; 白天写代码，晚上写博客，梦里在调试... 💭
          </p>
        </div>
      </BoxReveal>
    </div>
  );
}
