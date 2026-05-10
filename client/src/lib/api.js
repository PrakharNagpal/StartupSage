import { normalizeSages } from "./sages.js";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export function resolveApiUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function warmBackend() {
  return fetch(resolveApiUrl("/health"), {
    mode: "cors",
    cache: "no-store",
  }).catch(() => null);
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

async function fetchMultipart(path, formData, options = {}) {
  const response = await fetch(resolveApiUrl(path), {
    mode: "cors",
    method: "POST",
    body: formData,
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

function extensionForAudioType(contentType = "") {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("mpeg")) return "mp3";
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  return "webm";
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

export async function transcribeSessionAudio(sessionId, audioBlob) {
  const formData = new FormData();
  const extension = extensionForAudioType(audioBlob.type);
  formData.append("audio", audioBlob, `recording.${extension}`);
  return fetchMultipart(`/sessions/${sessionId}/transcribe`, formData);
}

export async function getSessionMessages(sessionId) {
  return fetchJson(`/sessions/${sessionId}/messages`);
}

export async function getReport(sessionId) {
  return fetchJson(`/sessions/${sessionId}/report`);
}
