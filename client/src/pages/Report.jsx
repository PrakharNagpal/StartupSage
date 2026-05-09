import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CircleAlert, Lightbulb, RotateCcw } from 'lucide-react'
import { fetchReport, normalizeReport } from '../api.js'
import { Alert, Badge, Button, Card, Separator, Skeleton } from '../components/ui.jsx'

function verdictTone(verdict) {
  const value = String(verdict || '').toLowerCase()
  if (value.includes('survive')) return 'success'
  if (value.includes('pivot')) return 'warning'
  if (value.includes('rethink')) return 'danger'
  return 'neutral'
}

function scoreLabel(score) {
  if (score >= 75) return 'Strong signal'
  if (score >= 55) return 'Needs a pivot lens'
  return 'High-risk concept'
}

export function Report() {
  const { id } = useParams()
  const reportQuery = useQuery({
    queryKey: ['report', id],
    queryFn: () => fetchReport(id),
    enabled: Boolean(id),
    select: normalizeReport,
  })

  if (reportQuery.isLoading) {
    return (
      <div className="screen report-screen">
        <Skeleton className="report-hero-skeleton" />
        <Skeleton className="report-row-skeleton" />
        <Skeleton className="report-row-skeleton" />
      </div>
    )
  }

  if (reportQuery.error) {
    return (
      <div className="screen report-screen">
        <Alert
          title="Could not load report"
          action={
            <Button variant="secondary" size="small" onClick={() => reportQuery.refetch()}>
              Retry
            </Button>
          }
        >
          {reportQuery.error.message}
        </Alert>
      </div>
    )
  }

  const report = reportQuery.data
  const score = Math.max(0, Math.min(100, Number(report.survival_score) || 0))

  return (
    <div className="screen report-screen">
      <Button asChild variant="ghost" className="back-link">
        <Link to={`/session/${id}`}>
          <ArrowLeft size={18} />
          Session
        </Link>
      </Button>

      <section className="report-hero">
        <div className="score-dial" style={{ '--score': `${score}%` }}>
          <span>{score}</span>
          <small>/100</small>
        </div>
        <div>
          <p className="eyebrow">Council report</p>
          <h1>{scoreLabel(score)}</h1>
          <p className="overall-verdict">{report.overall_verdict}</p>
        </div>
      </section>

      <Separator />

      <section className="report-section">
        <h2>Sage Verdicts</h2>
        <div className="verdict-grid">
          {report.sage_verdicts.map((sage) => (
            <Card className="verdict-card" key={sage.sage_id || sage.sage_name}>
              <div className="verdict-card-head">
                <div>
                  <h3>{sage.sage_name}</h3>
                  <p>{sage.persona || sage.failed_startup}</p>
                </div>
                <Badge tone={verdictTone(sage.verdict)}>{sage.verdict}</Badge>
              </div>
              <p>{sage.rationale}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="report-columns">
        <Card className="list-card">
          <h2>
            <CircleAlert size={20} />
            Top Risks
          </h2>
          <ul>
            {report.top_risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </Card>

        <Card className="list-card">
          <h2>
            <Lightbulb size={20} />
            Suggested Improvements
          </h2>
          <ul>
            {report.top_improvements.map((improvement) => (
              <li key={improvement}>{improvement}</li>
            ))}
          </ul>
        </Card>
      </section>

      <Card className="parallel-card">
        <CheckCircle2 size={22} />
        <div>
          <h2>Closest Historical Parallel</h2>
          <strong>{report.closest_parallel.name}</strong>
          <p>{report.closest_parallel.why}</p>
        </div>
      </Card>

      <section className="next-steps">
        <h2>Recommended Next Steps</h2>
        <ol>
          {report.next_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <Button asChild variant="secondary" className="start-over">
        <Link to="/submit">
          <RotateCcw size={17} />
          Start Over
        </Link>
      </Button>
    </div>
  )
}
