import { useEffect, useState } from "react";

import { resolveApiUrl } from "../lib/api.js";

const namedEvents = ["token", "message_done", "done", "sage_token", "sage_done", "verdict", "report_ready"];

function parseEventData(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return { value };
  }
}

export function useSSE(path, { enabled = true } = {}) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(enabled ? "connecting" : "idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !path) {
      setStatus("idle");
      return undefined;
    }

    const source = new EventSource(resolveApiUrl(path));
    const listeners = [];

    setEvents([]);
    setError(null);
    setStatus("connecting");

    const push = (event) => {
      setEvents((current) => [
        ...current,
        {
          id: event.lastEventId || `${event.type}-${Date.now()}-${current.length}`,
          type: event.type || "message",
          data: parseEventData(event.data),
          receivedAt: Date.now(),
        },
      ]);
    };

    const register = (eventName) => {
      source.addEventListener(eventName, push);
      listeners.push(eventName);
    };

    register("message");
    namedEvents.forEach(register);

    source.onopen = () => {
      setStatus("open");
      setError(null);
    };

    source.onerror = () => {
      setStatus("reconnecting");
      setError("Live stream disconnected. Reconnecting...");
    };

    return () => {
      listeners.forEach((eventName) => source.removeEventListener(eventName, push));
      source.close();
    };
  }, [enabled, path]);

  return { events, status, error };
}
