import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button, Card, Spinner, Textarea } from '../components/ui.jsx'
import { createSession, normalizeSages, researchSession } from '../api.js'

const maxChars = 500
const demoIdea =
  'An AI-powered meal planning app that generates weekly grocery lists and recipes based on your dietary preferences and budget, then auto-orders from Instacart.'

export function SubmitIdea() {
  const [idea, setIdea] = useState('')
  const navigate = useNavigate()

  const remaining = maxChars - idea.length
  const canSubmit = useMemo(() => idea.trim().length >= 12 && remaining >= 0, [idea, remaining])

  const submitMutation = useMutation({
    mutationFn: async () => {
      const session = await createSession(idea.trim())
      let researchPayload

      try {
        researchPayload = await researchSession(session.session_id)
      } catch {
        researchPayload = session
      }

      return {
        sessionId: session.session_id,
        sages: normalizeSages(researchPayload),
      }
    },
    onSuccess: ({ sessionId, sages }) => {
      navigate(`/session/${sessionId}`, { state: { sages, idea: idea.trim() } })
    },
  })

  return (
    <div className="screen submit-screen">
      <Button asChild variant="ghost" className="back-link">
        <a href="/">
          <ArrowLeft size={18} />
          Home
        </a>
      </Button>

      <section className="submit-panel">
        <p className="eyebrow">Submit for judgment</p>
        <h1>Tell the council what you are building.</h1>
        <p className="screen-copy">
          Keep it crisp. The sharper the idea, the sharper the questions.
        </p>

        <Card className="idea-card">
          <Textarea
            maxLength={maxChars}
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Describe your startup idea in 2-3 sentences..."
            disabled={submitMutation.isPending}
          />

          <div className="textarea-footer">
            <span className={remaining < 40 ? 'char-count warn' : 'char-count'}>
              {idea.length}/{maxChars}
            </span>
            <Button
              variant="ghost"
              size="small"
              type="button"
              onClick={() => setIdea(demoIdea)}
              disabled={submitMutation.isPending}
            >
              <Sparkles size={16} />
              Try a demo idea
            </Button>
          </div>

          {submitMutation.error ? (
            <p className="form-error">{submitMutation.error.message}</p>
          ) : null}

          <Button
            className="submit-button"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? <Spinner label="Summoning the council..." /> : 'Face the Council'}
          </Button>

          <p className="fine-print">
            You will be challenged by 3 AI sages embodying real failed founders.
          </p>
        </Card>
      </section>
    </div>
  )
}
