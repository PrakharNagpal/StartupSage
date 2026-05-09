import { normalizeSages } from "./sages.js";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export function resolveApiUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(resolveApiUrl(path), {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || response.statusText;
    const error = new Error(detail || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function createSession(idea) {
  const payload = await fetchJson("/sessions", {
    method: "POST",
    body: JSON.stringify({ idea, idea_text: idea }),
  });

  return {
    raw: payload,
    sessionId: payload.session_id || payload.id,
    status: payload.status || "created",
    sages: normalizeSages(payload.sages),
  };
}

export async function researchSession(sessionId) {
  try {
    const payload = await fetchJson(`/sessions/${sessionId}/research`, {
      method: "POST",
    });
    return normalizeSages(payload?.sages || payload);
  } catch (error) {
    if (error.status === 404 || error.status === 405) return [];
    throw error;
  }
}

export async function sendSessionMessage(sessionId, content) {
  return fetchJson(`/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ role: "user", content }),
  });
}

export async function endSession(sessionId) {
  return fetchJson(`/sessions/${sessionId}/end`, {
    method: "POST",
  });
}

export async function getSessionMessages(sessionId) {
  return fetchJson(`/sessions/${sessionId}/messages`);
}

export async function getReport(sessionId) {
  return fetchJson(`/sessions/${sessionId}/report`);
}
