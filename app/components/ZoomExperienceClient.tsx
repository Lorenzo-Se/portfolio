"use client";

import dynamic from "next/dynamic";

const ZoomExperience = dynamic(
  () => import("./ZoomExperience").then((module) => module.ZoomExperience),
  { ssr: false },
);

export function ZoomExperienceClient() {
  return <ZoomExperience />;
}
