"use client";

import { useSyncExternalStore } from "react";

const subscribe = (tick: () => void) => {
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
};
const seconds = () => Math.floor(Date.now() / 1000);

/**
 * Current time in whole seconds, updating every second.
 * Returns null while rendering on the server, so pages stay cacheable and
 * the first paint never shows a stale time.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, seconds, () => null);
}

/** Splits the time left until `target` into days, hours, minutes and seconds. */
export function timeLeft(now: number | null, target: string) {
  const left = now === null ? 0 : Math.max(0, Math.floor(new Date(target).getTime() / 1000) - now);
  return {
    ready: now !== null,
    over: now !== null && left === 0,
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    mins: Math.floor((left % 3600) / 60),
    secs: left % 60,
  };
}
