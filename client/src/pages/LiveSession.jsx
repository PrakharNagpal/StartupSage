import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, Send, Wifi } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import PageShell from "../components/layout/PageShell.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Input } from "../components/ui/input.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { useSSE } from "../hooks/useSSE.js";
import { sendSessionMessage } from "../lib/api.js";
import { makeId } from "../lib/utils.js";
import { loadSessionSages } from "../lib/sages.js";
import { verdictBadgeVariant, verdictLabel } from "../lib/report.js";

function SageAvatar({ sage }) {
  return (
    <div
      className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/10 text-base font-bold text-black shadow-xl"
      style={{
        background: `radial-gradient(circle at 35% 25%, rgba(255,255,255,0.75), ${sage.avatarColor} 36%, #101010 100%)`,
      }}
    >
      {sage.name
        .split(" ")
        .filter(Boolean)
        .slice(1, 3)
        .map((word) => word[0])
        .join("")}
    </div>
  );
}

function SageCard({ sage, verdict, index }) {
  return (
    <Card className="animate-fadeIn" style={{ animationDelay: `${index * 120}ms` }}>
      <CardContent className="flex gap-4 p-4">
        <SageAvatar sage={sage} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-semibold leading-5 text-white">{sage.name}</h2>
            {verdict ? (
              <Badge className="animate-pulseGold" variant={verdictBadgeVariant(verdict.verdict)}>
                {verdictLabel(verdict.verdict)}
              </Badge>
            ) : (
              <Badge variant="outline">Listening</Badge>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-gold">{sage.failedStartup}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/[0.52]">{sage.persona}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeTokenEvent(data, sagesByKey) {
  const sageKey = data.sage_id || data.sage_key || data.key || "sage_1";
  const sage = sagesByKey.get(sageKey);
  return {
    sageKey,
    sageName: data.sage_name || data.name || sage?.name || "The Council",
    token: data.token || data.value || "",
  };
}

export default function LiveSession() {
  const { id } = useParams();
  const sages = useMemo(() => loadSessionSages(id), [id]);
  const sagesByKey = useMemo(() => new Map(sages.map((sage) => [sage.key, sage])), [sages]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(1);
  const [verdicts, setVerdicts] = useState({});
  const [reportReady, setReportReady] = useState(false);
  const processedEvents = useRef(0);
  const feedEndRef = useRef(null);

  const { events, status, error: streamError } = useSSE(`/sessions/${id}/stream`, { enabled: Boolean(id) });

  const sendMessage = useMutation({
    mutationFn: (content) => sendSessionMessage(id, content),
  });

  useEffect(() => {
    const pending = events.slice(processedEvents.current);
    if (!pending.length) return;

    pending.forEach((event) => {
      if (event.type === "token" || event.type === "sage_token") {
        const tokenEvent = normalizeTokenEvent(event.data, sagesByKey);
        if (!tokenEvent.token) return;

        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "sage" && last.sageKey === tokenEvent.sageKey && last.streaming) {
            next[next.length - 1] = { ...last, content: `${last.content}${tokenEvent.token}` };
            return next;
          }
          return [
            ...next,
            {
              id: makeId("sage"),
              role: "sage",
              sageKey: tokenEvent.sageKey,
              sageName: tokenEvent.sageName,
              content: tokenEvent.token,
              streaming: true,
            },
          ];
        });
      }

      if (event.type === "message_done" || event.type === "sage_done") {
        const sageKey = event.data.sage_id || event.data.sage_key || event.data.key;
        const nextRound = Number(event.data.round);
        if (Number.isFinite(nextRound)) setRound(Math.max(1, Math.min(2, nextRound)));
        setMessages((current) =>
          current.map((message) => (message.sageKey === sageKey ? { ...message, streaming: false } : message)),
        );
      }

      if (event.type === "verdict") {
        const sageKey = event.data.sage_id || event.data.sage_key || event.data.key;
        setVerdicts((current) => ({
          ...current,
          [sageKey]: {
            verdict: event.data.verdict,
            rationale: event.data.rationale,
          },
        }));
      }

      if (event.type === "done" || event.type === "report_ready") {
        setReportReady(true);
        setMessages((current) => current.map((message) => ({ ...message, streaming: false })));
      }
    });

    processedEvents.current = events.length;
  }, [events, sagesByKey]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || sendMessage.isPending) return;

    setMessages((current) => [...current, { id: makeId("user"), role: "user", content }]);
    setInput("");
    sendMessage.mutate(content);
  };

  return (
    <PageShell ambience={false}>
      <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-white/[0.62]">
              <Wifi className="h-4 w-4 text-gold" />
              {status === "open" ? "Live stream connected" : "Connecting stream"}
            </div>
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">Live Session</h1>
            <p className="mt-2 text-sm text-white/[0.52]">Round {round} of 2</p>
          </div>
          {reportReady ? (
            <Button asChild>
              <Link to={`/report/${id}`}>
                View Report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          {sages.map((sage, index) => (
            <SageCard key={sage.key} sage={sage} verdict={verdicts[sage.key]} index={index} />
          ))}
        </div>

        {streamError && status !== "open" ? (
          <Alert>
            <AlertTitle>Stream status</AlertTitle>
            <AlertDescription>{streamError}</AlertDescription>
          </Alert>
        ) : null}

        {sendMessage.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Message not sent</AlertTitle>
            <AlertDescription>{sendMessage.error?.message || "Try sending it again."}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="flex min-h-0 flex-1 flex-col bg-[rgba(16,16,16,0.88)]">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle>Council Transcript</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[420px] flex-1 flex-col p-0">
            <div className="chat-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
              {!messages.length ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-10/12" />
                  <Skeleton className="ml-auto h-12 w-7/12" />
                  <Skeleton className="h-16 w-8/12" />
                </div>
              ) : (
                messages.map((message) => {
                  const sage = sagesByKey.get(message.sageKey);
                  const isUser = message.role === "user";
                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[min(760px,92%)] rounded-lg border px-4 py-3 ${
                          isUser
                            ? "border-gold/[0.24] bg-gold/[0.12] text-white"
                            : "border-white/10 bg-white/[0.055] text-white/[0.86]"
                        }`}
                      >
                        {!isUser ? (
                          <div className="mb-1 text-xs font-semibold text-gold">
                            {message.sageName || sage?.name || "The Council"}
                          </div>
                        ) : null}
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.content}
                          {message.streaming ? <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-gold align-middle" /> : null}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={feedEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-3 border-t border-white/10 p-4">
              <Input
                value={input}
                placeholder="Answer the council..."
                onChange={(event) => setInput(event.target.value)}
                disabled={sendMessage.isPending}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || sendMessage.isPending} aria-label="Send message">
                {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
