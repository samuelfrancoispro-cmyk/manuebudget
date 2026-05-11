import type { Rect } from '@/types';

export function overlaps(a: Rect, b: Rect, gap = 8): boolean {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

export function hasCollision(rect: Rect, others: Rect[], gap = 8): boolean {
  return others.some((o) => overlaps(rect, o, gap));
}

export function screenToWorld(
  screenX: number, screenY: number,
  canvasRect: DOMRect, panX: number, panY: number, zoom: number
): { x: number; y: number } {
  return {
    x: (screenX - canvasRect.left - panX) / zoom,
    y: (screenY - canvasRect.top  - panY) / zoom,
  };
}
