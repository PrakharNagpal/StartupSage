export const defaultSages = [
  {
    key: "distribution",
    name: "The Distribution Skeptic",
    persona: "Quibi founder",
    failedStartup: "Quibi",
    sector: "Streaming Media",
    failureLens: "Audience behavior and acquisition assumptions.",
    avatarColor: "#d4a847",
  },
  {
    key: "timing",
    name: "The Timing Realist",
    persona: "Webvan founder",
    failedStartup: "Webvan",
    sector: "Grocery Delivery",
    failureLens: "Market readiness and operational timing.",
    avatarColor: "#38b8a7",
  },
  {
    key: "economics",
    name: "The Unit Economics Hawk",
    persona: "Jawbone founder",
    failedStartup: "Jawbone",
    sector: "Consumer Hardware",
    failureLens: "Margin, payback, retention, and support load.",
    avatarColor: "#bb4a3b",
  },
];

export function normalizeSage(sage = {}, index = 0) {
  const fallback = defaultSages[index] || defaultSages[0];
  const key = sage.id || sage.key || sage.sage_id || fallback.key || `sage_${index + 1}`;
  const name = sage.name || sage.archetype || sage.sage_name || fallback.name;
  const failedStartup =
    sage.failed_startup || sage.failedStartup || sage.startup_name || fallback.failedStartup;

  return {
    key,
    name,
    persona: sage.persona || sage.failure_lens || fallback.persona,
    failedStartup,
    sector: sage.sector || fallback.sector,
    failureLens: sage.failure_lens || sage.failureLens || fallback.failureLens,
    avatarColor: sage.avatar_color || sage.avatarColor || fallback.avatarColor,
  };
}

export function normalizeSages(input) {
  const sages = Array.isArray(input) ? input : [];
  if (!sages.length) return defaultSages;
  return sages.slice(0, 3).map(normalizeSage);
}

export function saveSessionSages(sessionId, sages) {
  if (!sessionId) return;
  sessionStorage.setItem(`startupsage:sages:${sessionId}`, JSON.stringify(sages));
}

export function loadSessionSages(sessionId) {
  try {
    const stored = sessionStorage.getItem(`startupsage:sages:${sessionId}`);
    return stored ? normalizeSages(JSON.parse(stored)) : defaultSages;
  } catch {
    return defaultSages;
  }
}
