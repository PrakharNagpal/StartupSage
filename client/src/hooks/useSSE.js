import { useEffect, useMemo, useRef, useState } from 'react'

const eventTypes = ['sage_token', 'sage_done', 'verdict', 'report_ready', 'token', 'message_done', 'done']

function normalizeEvent(type, payload) {
  if (type === 'token') {
    return {
      event: 'sage_token',
      data: {
        sage_id: payload.sage_id || payload.sage_key,
        sage_key: payload.sage_key,
        sage_name: payload.sage_name,
        token: payload.token,
      },
    }
  }

  if (type === 'message_done') {
    return {
      event: 'sage_done',
      data: {
        sage_id: payload.sage_id || payload.sage_key,
        sage_key: payload.sage_key,
        sage_name: payload.sage_name,
      },
    }
  }

  if (type === 'done') {
    return {
      event: 'report_ready',
      data: payload,
    }
  }

  return { event: type, data: payload }
}

function parsePayload(raw) {
  if (!raw) return {}

  try {
    return JSON.parse(raw)
  } catch {
    return { token: raw }
  }
}

export function useSSE(url, enabled = true) {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState(enabled ? 'connecting' : 'idle')
  const retryRef = useRef(null)
  const sourceRef = useRef(null)

  useEffect(() => {
    if (!enabled || !url) {
      return undefined
    }

    let closed = false

    function connect() {
      if (closed) return
      setStatus('connecting')

      const source = new EventSource(url)
      sourceRef.current = source

      source.onopen = () => setStatus('open')

      source.onerror = () => {
        setStatus('reconnecting')
        source.close()

        if (!closed) {
          retryRef.current = window.setTimeout(connect, 1500)
        }
      }

      eventTypes.forEach((type) => {
        source.addEventListener(type, (event) => {
          const normalized = normalizeEvent(type, parsePayload(event.data))
          setEvents((previous) => [...previous, { ...normalized, id: crypto.randomUUID() }])
        })
      })

      source.onmessage = (event) => {
        const normalized = normalizeEvent(event.type || 'message', parsePayload(event.data))
        setEvents((previous) => [...previous, { ...normalized, id: crypto.randomUUID() }])
      }
    }

    connect()

    return () => {
      closed = true
      window.clearTimeout(retryRef.current)
      sourceRef.current?.close()
    }
  }, [enabled, url])

  return useMemo(() => ({ events, status, clear: () => setEvents([]) }), [events, status])
}
