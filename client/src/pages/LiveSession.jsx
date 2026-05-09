import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, Send, Wifi } from 'lucide-react'
import { fetchMessages, normalizeMessages, normalizeSages, sendMessage, streamUrl } from '../api.js'
import { useSSE } from '../hooks/useSSE.js'
import { Alert, Badge, Button, Card, Input, Skeleton } from '../components/ui.jsx'

function verdictTone(verdict) {
  const value = String(verdict || '').toLowerCase()
  if (value.includes('survive')) return 'success'
  if (value.includes('pivot')) return 'warning'
  if (value.includes('rethink')) return 'danger'
  return 'neutral'
}

function displayVerdict(verdict) {
  if (!verdict) return null
  const value = String(verdict).toLowerCase()
  if (value === 'survives') return 'Survives'
  if (value === 'pivot') return 'Pivot'
  if (value === 'rethink') return 'Rethink'
  return verdict
}

export function LiveSession() {
  const { id } = useParams()
  const location = useLocation()
  const feedRef = useRef(null)
  const handledEvents = useRef(new Set())
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [verdicts, setVerdicts] = useState({})
  const [reportReady, setReportReady] = useState(false)
  const [round, setRound] = useState(1)

  const sages = useMemo(() => normalizeSages(location.state), [location.state])
  const sse = useSSE(streamUrl(id), Boolean(id))

  const historyQuery = useQuery({
    queryKey: ['messages', id],
    queryFn: () => fetchMessages(id),
    enabled: Boolean(id),
  })

  const historyMessages = useMemo(
    () => (historyQuery.data ? normalizeMessages(historyQuery.data, sages) : []),
    [historyQuery.data, sages],
  )

  const visibleMessages = useMemo(
    () => [...historyMessages, ...messages],
    [historyMessages, messages],
  )

  useEffect(() => {
    sse.events.forEach((event) => {
      if (handledEvents.current.has(event.id)) return
      handledEvents.current.add(event.id)

      if (event.event === 'sage_token') {
        const sage = sages.find(
          (item) =>
            item.id === event.data.sage_id ||
            item.key === event.data.sage_key ||
            item.id === event.data.sage_key,
        )
        const sageId = sage?.id || event.data.sage_id || event.data.sage_key || 'sage_1'

        setMessages((current) => {
          const last = current[current.length - 1]

          if (last?.role === 'sage' && last.sageId === sageId && last.streaming) {
            return current.map((message, index) =>
              index === current.length - 1
                ? { ...message, content: `${message.content}${event.data.token || ''}` }
                : message,
            )
          }

          return [
            ...current,
            {
              id: crypto.randomUUID(),
              role: 'sage',
              sageId,
              sageKey: sage?.key || event.data.sage_key,
              sageName: sage?.name || event.data.sage_name || 'Sage',
              content: event.data.token || '',
              streaming: true,
            },
          ]
        })
      }

      if (event.event === 'sage_done') {
        const sage = sages.find(
          (item) =>
            item.id === event.data.sage_id ||
            item.key === event.data.sage_key ||
            item.id === event.data.sage_key,
        )

        setMessages((current) =>
          current.map((message) =>
            message.role === 'sage' && message.sageId === (sage?.id || event.data.sage_id || event.data.sage_key)
              ? { ...message, streaming: false }
              : message,
          ),
        )
      }

      if (event.event === 'verdict') {
        setVerdicts((current) => ({
          ...current,
          [event.data.sage_id || event.data.sage_key]: event.data,
        }))
      }

      if (event.event === 'report_ready') {
        setReportReady(true)
      }
    })
  }, [sse.events, sages])

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [visibleMessages])

  const messageMutation = useMutation({
    mutationFn: (content) => sendMessage(id, content),
    onMutate: (content) => {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content,
        },
      ])
      setDraft('')
      setRound((current) => Math.min(2, current + 1))
    },
  })

  function submitMessage(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || messageMutation.isPending) return
    messageMutation.mutate(content)
  }

  return (
    <div className="screen session-screen">
      <header className="session-header">
        <div>
          <p className="eyebrow">Live council</p>
          <h1>The sages are listening.</h1>
        </div>
        <div className="session-status">
          <Badge tone="neutral">Round {round} of 2</Badge>
          <span className={`connection ${sse.status}`}>
            <Wifi size={16} />
            {sse.status}
          </span>
        </div>
      </header>

      <section className="sage-grid">
        {sages.map((sage, index) => {
          const verdict = verdicts[sage.id] || verdicts[sage.key]

          return (
            <Card className="sage-card" key={sage.id} style={{ animationDelay: `${index * 120}ms` }}>
              <div className="sage-avatar" style={{ '--avatar-color': sage.avatar_color }}>
                <span>{sage.failed_startup.slice(0, 1)}</span>
              </div>
              <div>
                <h2>{sage.name}</h2>
                <p>{sage.persona}</p>
                <small>{sage.failed_startup}</small>
              </div>
              {verdict ? (
                <Badge className="verdict-badge" tone={verdictTone(verdict.verdict)}>
                  {displayVerdict(verdict.verdict)}
                </Badge>
              ) : null}
            </Card>
          )
        })}
      </section>

      {historyQuery.isLoading && visibleMessages.length === 0 ? (
        <div className="session-loading">
          <Skeleton className="message-skeleton" />
          <Skeleton className="message-skeleton short" />
        </div>
      ) : null}

      {historyQuery.error && visibleMessages.length === 0 ? (
        <Alert title="Could not load session history">
          {historyQuery.error.message}
        </Alert>
      ) : null}

      <section className="chat-panel" ref={feedRef}>
        {visibleMessages.map((message) => {
          const sage = sages.find((item) => item.id === message.sageId || item.key === message.sageKey)
          const name = message.role === 'user' ? 'You' : message.sageName || sage?.name || 'Council'

          return (
            <article className={`message-row ${message.role}`} key={message.id}>
              <div className="message-bubble">
                <span>{name}</span>
                <p>{message.content}</p>
              </div>
            </article>
          )
        })}
      </section>

      {messageMutation.error ? (
        <p className="form-error inline-error">{messageMutation.error.message}</p>
      ) : null}

      <form className="composer" onSubmit={submitMessage}>
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Answer the council..."
          disabled={messageMutation.isPending}
        />
        <Button type="submit" disabled={!draft.trim() || messageMutation.isPending}>
          <Send size={17} />
          Send
        </Button>
      </form>

      {reportReady ? (
        <Button asChild className="report-ready">
          <Link to={`/report/${id}`}>
            View Report
            <ArrowRight size={18} />
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
