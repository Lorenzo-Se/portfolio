const MAX_REM = 9.6;
const MIN_REM = 1.35;
const STEP_PX = 0.5;
const SAFETY_PX = 6;

function maxCharSpread(text: string): number {
  let max = 0;
  for (let index = 0; index < text.length; index += 1) {
    const dx = (index - text.length / 2) * 28;
    max = Math.max(max, Math.abs(dx));
  }
  return max;
}

function contentWidth(stage: HTMLElement): number {
  const style = getComputedStyle(stage);
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padRight = parseFloat(style.paddingRight) || 0;
  const fromStage = stage.clientWidth - padLeft - padRight;

  const viewportStyle = getComputedStyle(document.documentElement);
  const viewportPad =
    (parseFloat(viewportStyle.paddingLeft) || 0) +
    (parseFloat(viewportStyle.paddingRight) || 0);

  const fromViewport = document.documentElement.clientWidth - viewportPad;

  return Math.max(Math.min(fromStage, fromViewport), 0);
}

function measureLineWidth(line: HTMLElement): number {
  const chars = line.querySelectorAll<HTMLElement>(".hero-char");
  if (chars.length === 0) {
    return line.scrollWidth;
  }

  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;

  for (const char of chars) {
    const rect = char.getBoundingClientRect();
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
  }

  return right - left;
}

function titleOverflows(
  lines: NodeListOf<HTMLElement>,
  available: number,
): boolean {
  return Array.from(lines).some((line) => measureLineWidth(line) > available);
}

export function fitHeroTitleSize(
  stage: HTMLElement,
  title: HTMLElement,
  firstName: string,
  lastName: string,
): void {
  const lines = title.querySelectorAll<HTMLElement>(".hero-line");
  if (lines.length === 0) {
    return;
  }

  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const maxPx = MAX_REM * rootPx;
  const minPx = MIN_REM * rootPx;
  const scrollSpread = Math.max(maxCharSpread(firstName), maxCharSpread(lastName));
  const available = Math.max(contentWidth(stage) - scrollSpread - SAFETY_PX, 0);

  title.style.fontSize = `${maxPx}px`;

  let sizePx = maxPx;
  while (sizePx > minPx && titleOverflows(lines, available)) {
    sizePx -= STEP_PX;
    title.style.fontSize = `${sizePx}px`;
  }

  if (titleOverflows(lines, available) && sizePx <= minPx) {
    const currentWidth = Math.max(
      ...Array.from(lines).map((line) => measureLineWidth(line)),
      1,
    );
    const scale = available / currentWidth;
    title.style.fontSize = `${minPx}px`;
    title.style.transform = `scale(${scale})`;
    title.style.transformOrigin = "left bottom";
  } else {
    title.style.transform = "";
    title.style.transformOrigin = "";
  }
}
