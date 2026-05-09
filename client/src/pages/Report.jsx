import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CircleAlert, RotateCcw, Sparkles, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import PageShell from "../components/layout/PageShell.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Separator } from "../components/ui/separator.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { getReport } from "../lib/api.js";
import { loadSessionSages } from "../lib/sages.js";
import { normalizeReport, verdictBadgeVariant, verdictLabel } from "../lib/report.js";

function ScoreDial({ score }) {
  const degrees = Math.max(0, Math.min(100, Number(score) || 0)) / 100 * 360;
  return (
    <div className="score-dial" style={{ "--score-degrees": `${degrees}deg` }}>
      <div className="text-center">
        <div className="text-5xl font-extrabold text-white">{score}</div>
        <div className="mt-1 text-xs font-semibold uppercase text-gold">Survival</div>
      </div>
    </div>
  );
}

function ReportLoading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 py-8">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}

export default function Report() {
  const { id } = useParams();
  const sages = useMemo(() => loadSessionSages(id), [id]);
  const reportQuery = useQuery({
    queryKey: ["report", id],
    queryFn: () => getReport(id),
    enabled: Boolean(id),
  });

  const report = useMemo(
    () => (reportQuery.data ? normalizeReport(reportQuery.data, sages) : null),
    [reportQuery.data, sages],
  );

  return (
    <PageShell>
      {reportQuery.isLoading ? <ReportLoading /> : null}

      {reportQuery.isError ? (
        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
          <Alert variant="destructive">
            <AlertTitle>Report unavailable</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>{reportQuery.error?.message || "The report endpoint did not return a result."}</p>
              <Button variant="outline" onClick={() => reportQuery.refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </section>
      ) : null}

      {report ? (
        <section className="mx-auto grid w-full max-w-6xl gap-5 py-6">
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Button asChild variant="ghost" className="mb-5 px-0">
                <Link to={`/session/${id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Session
                </Link>
              </Button>
              <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">Council Report</h1>
            </div>
            <Button asChild variant="outline">
              <Link to="/submit">
                <RotateCcw className="h-4 w-4" />
                Start Over
              </Link>
            </Button>
          </header>

          <Card className="overflow-hidden border-gold/[0.16] bg-[rgba(16,16,16,0.86)]">
            <CardContent className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:items-center">
              <div className="flex justify-center md:justify-start">
                <ScoreDial score={report.score} />
              </div>
              <div>
                <Badge variant={report.score >= 70 ? "survives" : report.score >= 45 ? "pivot" : "rethink"}>
                  Overall Verdict
                </Badge>
                <p className="mt-4 text-lg leading-8 text-white/[0.76]">{report.overallVerdict}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/[0.18] bg-[rgba(16,16,16,0.9)]">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle>Council Summary</CardTitle>
                <Badge variant={verdictBadgeVariant(report.councilSummary.verdict)}>
                  {verdictLabel(report.councilSummary.verdict)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg italic leading-8 text-white/[0.78]">
                {report.councilSummary.consensus}
              </p>

              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gold">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  What we liked
                </h3>
                <ul className="mt-3 space-y-3">
                  {report.councilSummary.whatWeLiked.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-white/[0.7]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleAlert className="h-5 w-5 text-ember" />
                  Top Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.topRisks.map((risk) => (
                    <li key={risk} className="flex gap-3 text-sm leading-6 text-white/[0.68]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  Suggested Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.topImprovements.map((improvement) => (
                    <li key={improvement} className="flex gap-3 text-sm leading-6 text-white/[0.68]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gold/20 bg-gold/[0.08]">
            <CardHeader>
              <CardTitle>Closest Historical Parallel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-gold">{report.closestParallel.name}</p>
              <p className="mt-2 text-sm leading-6 text-white/[0.68]">{report.closestParallel.why}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3">
                {report.nextSteps.map((step, index) => (
                  <li key={step} className="grid grid-cols-[2rem_1fr] items-start gap-3 text-sm leading-6 text-white/70">
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/25 bg-gold/10 text-sm font-bold text-gold">
                      {index + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Separator />
        </section>
      ) : null}
    </PageShell>
  );
}
