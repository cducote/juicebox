"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type SSEEvent = {
  type: string;
  data: Record<string, unknown>;
};

/**
 * Connects to the SSE endpoint for real-time updates.
 * Auto-reconnects with exponential backoff on disconnect.
 * Falls back to 30-second polling via router.refresh() if SSE fails repeatedly.
 */
export function useEventSource(
  onEvent?: (event: SSEEvent) => void,
) {
  const router = useRouter();
  const sourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const [connected, setConnected] = useState(false);

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      onEvent?.(event);
      // Always refresh server components on any event
      router.refresh();
    },
    [onEvent, router],
  );

  useEffect(() => {
    let cancelled = false;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    function connect() {
      if (cancelled) return;

      const source = new EventSource("/api/events");
      sourceRef.current = source;

      source.onopen = () => {
        retriesRef.current = 0;
        setConnected(true);
        // Clear fallback polling if SSE reconnects
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      source.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data) as SSEEvent;
          handleEvent(parsed);
        } catch {
          // Ignore malformed messages
        }
      };

      source.onerror = () => {
        source.close();
        setConnected(false);
        sourceRef.current = null;

        if (cancelled) return;

        retriesRef.current++;

        // After 5 failed retries, fall back to polling
        if (retriesRef.current > 5) {
          if (!fallbackInterval) {
            fallbackInterval = setInterval(() => {
              router.refresh();
            }, 30_000);
          }
          // Still try to reconnect SSE every 60s
          setTimeout(connect, 60_000);
        } else {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(1000 * 2 ** (retriesRef.current - 1), 16_000);
          setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      sourceRef.current?.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [handleEvent, router]);

  return { connected };
}
