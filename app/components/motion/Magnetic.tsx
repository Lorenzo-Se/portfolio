"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/app/lib/gsap";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

export function Magnetic({ children, className, strength = 14 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={(event) => {
        const node = ref.current;
        if (!node) {
          return;
        }
        const box = node.getBoundingClientRect();
        const x = event.clientX - (box.left + box.width / 2);
        const y = event.clientY - (box.top + box.height / 2);
        gsap.to(node, {
          x: x / strength,
          y: y / strength,
          duration: 0.45,
          ease: "power3.out",
        });
      }}
      onMouseLeave={() => {
        gsap.to(ref.current, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        });
      }}
    >
      {children}
    </div>
  );
}
