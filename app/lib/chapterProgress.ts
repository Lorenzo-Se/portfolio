export type ScrollState = {
  progress: number;
  activeIndex: number;
  byId: Record<string, number>;
};

const initial: ScrollState = {
  progress: 0,
  activeIndex: 0,
  byId: {},
};

let state: ScrollState = initial;

const indexListeners = new Set<() => void>();
const frameListeners = new Set<(next: ScrollState) => void>();

export function getScrollState(): ScrollState {
  return state;
}

export function getActiveIndex(): number {
  return state.activeIndex;
}

export function publishScrollState(next: ScrollState) {
  const indexChanged = next.activeIndex !== state.activeIndex;
  state = next;

  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty(
      "--scroll-progress",
      String(next.progress),
    );
    document.documentElement.style.setProperty(
      "--active-index",
      String(next.activeIndex),
    );
  }

  frameListeners.forEach((listener) => listener(state));
  if (indexChanged) {
    indexListeners.forEach((listener) => listener());
  }
}

export function onScrollFrame(listener: (next: ScrollState) => void) {
  frameListeners.add(listener);
  listener(state);
  return () => {
    frameListeners.delete(listener);
  };
}

export function subscribeActiveIndex(listener: () => void) {
  indexListeners.add(listener);
  return () => {
    indexListeners.delete(listener);
  };
}
