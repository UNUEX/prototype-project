'use client';

import { useEffect, useRef, useCallback } from 'react';

const IDLE_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'touchmove',
  'scroll',
  'wheel',
  'click',
  'focus',
];

/**
 * useIdleTimeout — вызывает onIdle если пользователь неактивен
 * в течении timeoutMs миллисекунд.
 *
 * @param onIdle  — колбэк при истечении таймера (обычно signOut)
 * @param timeoutMs — время неактивности в мс (default: 60_000 = 1 мин)
 * @param enabled — слушать только если пользователь залогинен
 */
export function useIdleTimeout(
  onIdle: () => void,
  timeoutMs: number = 600_000,
  enabled: boolean = true,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);

  // Держим актуальную ссылку на колбэк без перезапуска эффекта
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onIdleRef.current();
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Запускаем таймер сразу при монтировании / включении
    reset();

    IDLE_EVENTS.forEach(event =>
      window.addEventListener(event, reset, { passive: true }),
    );

    document.addEventListener('visibilitychange', reset, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      IDLE_EVENTS.forEach(event =>
        window.removeEventListener(event, reset),
      );
      document.removeEventListener('visibilitychange', reset);
    };
  }, [enabled, reset]);
}