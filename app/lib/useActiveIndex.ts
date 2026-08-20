"use client";

import { useSyncExternalStore } from "react";
import {
  getActiveIndex,
  subscribeActiveIndex,
} from "@/app/lib/chapterProgress";

export function useActiveIndex() {
  return useSyncExternalStore(
    subscribeActiveIndex,
    getActiveIndex,
    getActiveIndex,
  );
}
