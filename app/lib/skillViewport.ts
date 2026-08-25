"use client";

import { useEffect, useState } from "react";
import { MOBILE_MAX } from "@/app/lib/breakpoints";

export function useSkillMobileLayout(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);

    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  return mobile;
}
