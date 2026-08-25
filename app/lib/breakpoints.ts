export const MOBILE_MAX = 860;
export const PHONE_MAX = 600;

function viewportWidth(width?: number): number {
  if (width !== undefined) {
    return width;
  }
  if (typeof window === "undefined") {
    return MOBILE_MAX + 1;
  }
  return window.innerWidth;
}

export function isMobileViewport(width?: number): boolean {
  return viewportWidth(width) <= MOBILE_MAX;
}

export function isPhoneViewport(width?: number): boolean {
  return viewportWidth(width) <= PHONE_MAX;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(hover: none)").matches;
}
