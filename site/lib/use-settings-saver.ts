"use client";

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type PendingSave = { value: unknown; resolve: Array<(saved: boolean) => void> };

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function useSettingsSaver(setStatus: Dispatch<SetStateAction<SaveStatus>>) {
  const pending = useRef(new Map<string, PendingSave>());
  const flushTimer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (flushing.current || pending.current.size === 0) return;
    flushing.current = true;
    let saved = true;
    while (pending.current.size > 0) {
      const batch = pending.current;
      pending.current = new Map();
      const values = Object.fromEntries([...batch].map(([key, item]) => [key, item.value]));
      let batchSaved = false;
      for (let attempt = 0; attempt < 2 && !batchSaved; attempt += 1) {
        if (attempt > 0) await wait(200);
        try {
          const response = await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "settings", values }),
            keepalive: true,
          });
          batchSaved = response.ok;
        } catch {
          batchSaved = false;
        }
      }
      saved = saved && batchSaved;
      batch.forEach((item) => item.resolve.forEach((resolve) => resolve(batchSaved)));
    }
    flushing.current = false;
    setStatus(saved ? "saved" : "error");
    if (saved) {
      idleTimer.current = window.setTimeout(
        () => setStatus((status) => status === "saved" ? "idle" : status),
        900,
      );
    }
  }, [setStatus]);

  useEffect(() => {
    const saveBeforeLeaving = () => void flush();
    window.addEventListener("pagehide", saveBeforeLeaving);
    return () => {
      window.removeEventListener("pagehide", saveBeforeLeaving);
      if (flushTimer.current !== null) window.clearTimeout(flushTimer.current);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, [flush]);

  return useCallback((key: string, value: unknown) => {
    setStatus("saving");
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    const result = new Promise<boolean>((resolve) => {
      const existing = pending.current.get(key);
      pending.current.set(key, {
        value,
        resolve: existing ? [...existing.resolve, resolve] : [resolve],
      });
    });
    if (flushTimer.current === null) {
      flushTimer.current = window.setTimeout(() => {
        flushTimer.current = null;
        void flush();
      }, 80);
    }
    return result;
  }, [flush, setStatus]);
}
