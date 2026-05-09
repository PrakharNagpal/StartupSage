const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const apiBaseUrl = API_BASE_URL.replace(/\/$/, '')

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const detail = typeof body === 'object' ? body.detail || body.message : body
    const error = new Error(
      typeof detail === 'string' ? detail : JSON.stringify(detail || `Request failed with ${response.status}`),
    )
    error.status = response.status
    throw error
  }

  return body
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  return parseResponse(response)
}

export async function createSession(ideaText) {
  try {
    return await request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ idea_text: ideaText }),
    })
  } catch (error) {
    if (error.status !== 422 && !String(error.message).includes('Field required')) {
      throw error
    }

    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ idea: ideaText }),
    })
  }
}

export async function researchSession(sessionId) {
  return request(`/sessions/${sessionId}/research`, {
    method: 'POST',
  })
}

export async function sendMessage(sessionId, content) {
  return request(`/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role: 'user', content }),
  })
}

export async function fetchMessages(sessionId) {
  return request(`/sessions/${sessionId}/messages`)
}

export async function fetchReport(sessionId) {
  return request(`/sessions/${sessionId}/report`)
}

export function streamUrl(sessionId) {
  return `${apiBaseUrl}/sessions/${sessionId}/stream`
}

const fallbackSages = [
  {
    id: 'sage_1',
    key: 'distribution',
    name: 'The Distribution Skeptic',
    persona: 'Quibi founder',
    failed_startup: 'Quibi',
    avatar_color: '#9f7aea',
  },
  {
    id: 'sage_2',
    key: 'timing',
    name: 'The Timing Realist',
    persona: 'Webvan founder',
    failed_startup: 'Webvan',
    avatar_color: '#d4a847',
  },
  {
    id: 'sage_3',
    key: 'economics',
    name: 'The Unit Economics Hawk',
    persona: 'Jawbone founder',
    failed_startup: 'Jawbone',
    avatar_color: '#48bb78',
  },
]

export function normalizeSages(payload) {
  const source = Array.isArray(payload) ? payload : payload?.sages
  const sages = Array.isArray(source) && source.length ? source : fallbackSages

  return sages.map((sage, index) => ({
    id: sage.id || sage.sage_id || `sage_${index + 1}`,
    key: sage.key || sage.id || sage.sage_id || `sage_${index + 1}`,
    name: sage.name || sage.sage_name || sage.archetype || `Sage ${index + 1}`,
    persona: sage.persona || sage.failure_lens || sage.sector || 'Failed founder lens',
    failed_startup: sage.failed_startup || sage.startup_name || sage.company || 'Unknown startup',
    avatar_color: sage.avatar_color || fallbackSages[index % fallbackSages.length].avatar_color,
  }))
}

export function normalizeMessages(messages = [], sages = fallbackSages) {
  return messages.map((message, index) => {
    const sage = sages.find((item) => item.key === message.sage_key || item.id === message.sage_id)

    return {
      id: `history_${index}`,
      role: message.role,
      sageId: sage?.id || message.sage_id || message.sage_key,
      sageKey: message.sage_key || sage?.key,
      sageName: sage?.name || message.sage_name,
      content: message.content,
    }
  })
}

export function normalizeReport(payload) {
  if ('survival_score' in payload) {
    return payload
  }

  return {
    survival_score: payload.score ?? 50,
    overall_verdict: payload.markdown || 'The council report is still being generated.',
    sage_verdicts: fallbackSages.map((sage) => ({
      sage_id: sage.id,
      sage_name: sage.name,
      persona: sage.persona,
      failed_startup: sage.failed_startup,
      verdict: 'pivot',
      rationale: 'The current backend returned a baseline report, so this card uses the demo council lens.',
    })),
    top_risks: [
      'Distribution assumptions need direct evidence.',
      'Market timing needs a sharper trigger.',
      'Unit economics need a concrete payback model.',
    ],
    top_improvements: [
      'Pick one narrow beachhead segment.',
      'Run five target customer interviews.',
      'Model CAC, retention, and support load before building deeply.',
    ],
    closest_parallel: {
      name: 'Phase 0 baseline',
      why: 'The backend is returning markdown today; the React client is ready for the richer report JSON.',
    },
    next_steps: [
      'Validate one painful workflow with a specific buyer.',
      'Define the cheapest acquisition channel you can test this week.',
      'Run the first council session against the integrated agent backend.',
    ],
  }
}
