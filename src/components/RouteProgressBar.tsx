"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * App Router gives no "navigation started" event, so this fakes one: any
 * click on a same-origin, non-modified link starts the bar, and it
 * completes when the pathname/search params actually change (or after a
 * timeout, in case the link didn't navigate — e.g. it just opened a menu).
 */
export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState("done");
    const t = setTimeout(() => setState("idle"), 200);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setState("loading");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setState("idle"), 4000);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (state === "idle") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent" aria-hidden="true">
      <div
        className={`h-full bg-neutral-100 transition-all ease-out ${
          state === "loading" ? "duration-[3500ms]" : "duration-150"
        }`}
        style={{
          width: state === "loading" ? "85%" : "100%",
          opacity: state === "done" ? 0 : 1,
          transitionProperty: "width, opacity",
        }}
      />
    </div>
  );
}
