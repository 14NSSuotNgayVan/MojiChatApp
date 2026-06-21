import { useCallback, useRef } from 'react';

type PointerLikeEvent = React.PointerEvent<HTMLElement>;

type UseLongPressOptions = {
  enabled?: boolean;
  delay?: number;
  moveThreshold?: number;
  onLongPress: (event: PointerLikeEvent) => void;
  onPress?: (event: PointerLikeEvent) => void;
};

export function useLongPress({
  enabled = true,
  delay = 450,
  moveThreshold = 12,
  onLongPress,
  onPress,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const suppressClickUntilRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (event: PointerLikeEvent) => {
      if (!enabled) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      longPressTriggeredRef.current = false;
      pointerIdRef.current = event.pointerId;
      startRef.current = { x: event.clientX, y: event.clientY };

      clearTimer();
      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        suppressClickUntilRef.current = Date.now() + 400;
        onLongPress(event);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(12);
        }
      }, delay);
    },
    [clearTimer, delay, enabled, onLongPress]
  );

  const onPointerMove = useCallback(
    (event: PointerLikeEvent) => {
      if (!enabled || pointerIdRef.current !== event.pointerId || !startRef.current) return;

      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;
      if (Math.hypot(dx, dy) > moveThreshold) {
        clearTimer();
      }
    },
    [clearTimer, enabled, moveThreshold]
  );

  const finishPointer = useCallback(
    (event: PointerLikeEvent) => {
      if (!enabled || pointerIdRef.current !== event.pointerId) return;

      clearTimer();

      if (!longPressTriggeredRef.current && onPress) {
        onPress(event);
      }

      pointerIdRef.current = null;
      startRef.current = null;
    },
    [clearTimer, enabled, onPress]
  );

  const onPointerUp = useCallback(
    (event: PointerLikeEvent) => {
      finishPointer(event);
    },
    [finishPointer]
  );

  const onPointerCancel = useCallback(
    (event: PointerLikeEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      clearTimer();
      pointerIdRef.current = null;
      startRef.current = null;
      longPressTriggeredRef.current = false;
    },
    [clearTimer]
  );

  const onContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      event.preventDefault();
    },
    [enabled]
  );

  const shouldSuppressClick = useCallback(() => Date.now() < suppressClickUntilRef.current, []);

  const handlers = enabled
    ? {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onContextMenu,
      }
    : {};

  return { handlers, shouldSuppressClick };
}
