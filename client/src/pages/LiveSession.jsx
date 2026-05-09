import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function JudgeAvatar({ sage, isActive }) {
  const c = sage.avatarColor;
  return (
    <div className={`judge-figure ${isActive ? "active" : "idle"}`}>
      <svg viewBox="0 0 90 170" xmlns="http://www.w3.org/2000/svg" style={{ width: 100, display: "block" }}>

        {/* ══ THRONE CHAIR (drawn behind everything) ══ */}
        {/* Chair back — full Gothic arch shape */}
        <path d="M12 125 L12 50 Q12 16 45 10 Q78 16 78 50 L78 125 Z"
          fill="#4a2e0e" stroke="#7a5020" strokeWidth="1.8" />
        {/* Inner carved panel */}
        <path d="M19 122 L19 54 Q19 26 45 20 Q71 26 71 54 L71 122 Z"
          fill="#3a2208" stroke={c} strokeWidth="1.2" />
        {/* Vertical center groove */}
        <line x1="45" y1="22" x2="45" y2="120" stroke={c} strokeWidth="0.8" strokeOpacity="0.5" />
        {/* Horizontal grooves */}
        <line x1="22" y1="70" x2="68" y2="70" stroke={c} strokeWidth="0.7" strokeOpacity="0.4" />
        <line x1="22" y1="90" x2="68" y2="90" stroke={c} strokeWidth="0.7" strokeOpacity="0.4" />

        {/* Top finial */}
        <circle cx="45" cy="10" r="7" fill="#7a5020" stroke={c} strokeWidth="1.8" />
        <circle cx="45" cy="10" r="3.5" fill={c} />
        {/* Arch shoulder finials */}
        <circle cx="12" cy="50" r="4.5" fill="#7a5020" stroke={c} strokeWidth="1.4" />
        <circle cx="12" cy="50" r="2" fill={c} />
        <circle cx="78" cy="50" r="4.5" fill="#7a5020" stroke={c} strokeWidth="1.4" />
        <circle cx="78" cy="50" r="2" fill={c} />

        {/* ══ POWDERED WIG ══ */}
        {/* Side curls — behind face */}
        <ellipse cx="20" cy="70" rx="12" ry="18" fill="#edeae0" stroke="#ccc8ba" strokeWidth="1" />
        <ellipse cx="70" cy="70" rx="12" ry="18" fill="#edeae0" stroke="#ccc8ba" strokeWidth="1" />
        {/* Curl wave texture — left */}
        <path d="M13 58 Q17 62 13 67 Q17 72 13 77 Q17 82 13 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
        <path d="M20 58 Q24 62 20 67 Q24 72 20 77 Q24 82 20 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
        {/* Curl wave texture — right */}
        <path d="M63 58 Q67 62 63 67 Q67 72 63 77 Q67 82 63 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
        <path d="M70 58 Q74 62 70 67 Q74 72 70 77 Q74 82 70 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
        {/* Top wig — poofy dome */}
        <ellipse cx="45" cy="48" rx="26" ry="21" fill="#edeae0" stroke="#ccc8ba" strokeWidth="1.2" />
        {/* Wig wave rows */}
        <path d="M26 42 Q31 38 36 42 Q41 38 46 42 Q51 38 56 42 Q61 38 66 42" stroke="#ccc8ba" strokeWidth="1" fill="none" />
        <path d="M24 49 Q29 45 34 49 Q39 45 44 49 Q49 45 54 49 Q59 45 64 49" stroke="#ccc8ba" strokeWidth="1" fill="none" />

        {/* ══ FACE ══ */}
        <ellipse cx="45" cy="62" rx="18" ry="20" fill="#f6d09a" stroke="#e0a860" strokeWidth="1.2" />

        {/* Eyebrows — raised/alert when active */}
        <path d={`M31 52 Q36 ${isActive ? "49" : "51"} 41 52`}
          stroke="#8a5828" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d={`M49 52 Q54 ${isActive ? "49" : "51"} 59 52`}
          stroke="#8a5828" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="36" cy="60" rx="6" ry="6.5" fill="white" stroke="#555" strokeWidth="1" />
        <ellipse cx="54" cy="60" rx="6" ry="6.5" fill="white" stroke="#555" strokeWidth="1" />
        {/* Pupils — look up when active */}
        <circle cx="36" cy={isActive ? "58" : "60.5"} r="3.8" fill="#1a0800" />
        <circle cx="54" cy={isActive ? "58" : "60.5"} r="3.8" fill="#1a0800" />
        {/* Eye glint */}
        <circle cx="37.8" cy={isActive ? "56.4" : "58.9"} r="1.5" fill="white" />
        <circle cx="55.8" cy={isActive ? "56.4" : "58.9"} r="1.5" fill="white" />

        {/* Nose */}
        <ellipse cx="45" cy="68" rx="2.8" ry="2" fill="#e09858" opacity="0.55" />

        {/* Mouth */}
        {isActive ? (
          <path d="M36 74 Q45 81 54 74" stroke="#c06830" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ) : (
          <line x1="37" y1="75" x2="53" y2="75" stroke="#c06830" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Cheek blush */}
        <ellipse cx="29" cy="67" rx="5.5" ry="3.5" fill="#f08060" opacity="0.22" />
        <ellipse cx="61" cy="67" rx="5.5" ry="3.5" fill="#f08060" opacity="0.22" />

        {/* ══ JUDICIAL ROBE ══ */}
        {/* Robe main body */}
        <path d="M18 80 L5 125 L85 125 L72 80 Q45 75 18 80 Z" fill="#141414" />
        {/* Robe shoulder sheen */}
        <path d="M18 80 Q45 75 72 80 Q58 77 45 77 Q32 77 18 80 Z" fill="#2c2c2c" />
        {/* Left lapel */}
        <path d="M18 80 L34 80 L28 100 L5 125 Z" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="0.5" />
        {/* Right lapel */}
        <path d="M72 80 L56 80 L62 100 L85 125 Z" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="0.5" />

        {/* White jabot / bib */}
        <path d="M34 80 L32 100 Q45 106 58 100 L56 80 Q45 84 34 80 Z"
          fill="white" stroke="#ddd" strokeWidth="0.8" />
        {/* Jabot ruffles */}
        <path d="M34 85 Q45 89 56 85" stroke="#e0e0e0" strokeWidth="0.8" fill="none" />
        <path d="M33 92 Q45 96 57 92" stroke="#e0e0e0" strokeWidth="0.8" fill="none" />
        {/* Jabot pointed bottom */}
        <path d="M32 100 Q45 108 58 100 Q51 110 45 112 Q39 110 32 100 Z"
          fill="white" stroke="#ddd" strokeWidth="0.8" />

        {/* ══ CHAIR SEAT (in front of robe hem) ══ */}
        <rect x="4" y="123" width="82" height="13" rx="6"
          fill="#5a3610" stroke="#8a5820" strokeWidth="1.8" />
        {/* Seat cushion tint */}
        <rect x="8" y="125" width="74" height="8" rx="4"
          fill={`${c}22`} stroke={c} strokeWidth="0.9" />

        {/* ══ CHAIR LEGS ══ */}
        {/* Back legs */}
        <rect x="16" y="135" width="7" height="24" rx="3"
          fill="#6a4418" stroke="#8a5820" strokeWidth="1.2" />
        <rect x="67" y="135" width="7" height="24" rx="3"
          fill="#6a4418" stroke="#8a5820" strokeWidth="1.2" />
        {/* Front legs (slightly taller) */}
        <rect x="9" y="135" width="8" height="30" rx="3.5"
          fill="#7a5020" stroke="#9a6830" strokeWidth="1.4" />
        <rect x="73" y="135" width="8" height="30" rx="3.5"
          fill="#7a5020" stroke="#9a6830" strokeWidth="1.4" />
        {/* Stretcher bar */}
        <rect x="9" y="160" width="72" height="5" rx="2.5"
          fill="#5a3610" stroke="#8a5820" strokeWidth="1.1" />

      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="transcript-avatar transcript-avatar--user" aria-hidden="true">
      <svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="18" fill="#4f46e5" />
        {/* head */}
        <circle cx="18" cy="13" r="6.5" fill="white" />
        {/* shoulders */}
        <path d="M6 34 Q6 24 18 24 Q30 24 30 34" fill="white" />
        {/* face glint */}
        <circle cx="15.5" cy="11.5" r="1.8" fill="rgba(255,255,255,0.45)" />
      </svg>
    </div>
  );
}

function SageMiniAvatar({ sage }) {
  const c = sage.avatarColor;
  const initials = sage.name.split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("");
  return (
    <div
      className="transcript-avatar transcript-avatar--sage"
      style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), ${c} 55%, #2a1800 100%)` }}
      aria-hidden="true"
    >
      <span style={{ color: "white", fontSize: 11, fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
        {initials}
      </span>
    </div>
  );
}

function CouncilBench({ sages, verdicts, activeSageKey, messages, onBubbleClick }) {
  return (
    <div className="council-chamber animate-fadeIn">
      <div className="council-chamber-header">✦ &nbsp; The Council &nbsp; ✦</div>
      <div className="council-seats">
        {sages.map((sage) => {
          const isActive = sage.key === activeSageKey;
          const verdict = verdicts[sage.key];
          const latestMsg = messages.filter((m) => m.role === "sage" && m.sageKey === sage.key).slice(-1)[0];
          return (
            <div
              key={sage.key}
              className="council-seat"
              style={isActive ? { background: `radial-gradient(ellipse at 50% 100%, ${sage.avatarColor}14 0%, transparent 72%)` } : {}}
            >
              <div
                className={`judge-spotlight ${isActive ? "active" : ""}`}
                style={{
                  background: `conic-gradient(from 180deg at 50% 0%, transparent 28%, ${sage.avatarColor}20 50%, transparent 72%)`,
                }}
              />
              <JudgeAvatar sage={sage} isActive={isActive} />

              {latestMsg?.content ? (
                <button
                  className="judge-speech-bubble"
                  style={{ borderColor: `${sage.avatarColor}30` }}
                  onClick={() => onBubbleClick(sage.key)}
                  title="Click to jump to this message in the transcript"
                >
                  <p className="judge-speech-text">
                    {latestMsg.content.length > 180
                      ? "…" + latestMsg.content.slice(-180)
                      : latestMsg.content}
                    {latestMsg.streaming ? (
                      <span className="speech-cursor" style={{ background: sage.avatarColor }} />
                    ) : null}
                  </p>
                </button>
              ) : null}

              <div className="council-nameplate" style={{ borderColor: `${sage.avatarColor}44` }}>
                <div className="nameplate-name">{sage.name}</div>
                <div className="nameplate-startup">{sage.failedStartup}</div>
              </div>
              <div className="council-badge-row">
                {verdict ? (
                  <Badge className="animate-pulseGold" variant={verdictBadgeVariant(verdict.verdict)}>
                    {verdictLabel(verdict.verdict)}
                  </Badge>
                ) : isActive ? (
                  <Badge>Speaking</Badge>
                ) : (
                  <Badge variant="outline">Waiting</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="council-bench-face" />
    </div>
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
  const [activeSageKey, setActiveSageKey] = useState(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [verdicts, setVerdicts] = useState({});
  const [reportReady, setReportReady] = useState(false);
  const [introPhase, setIntroPhase] = useState("order"); // "order" | "begin" | "done"
  const processedEvents = useRef(0);
  const feedEndRef = useRef(null);
  const messageRefs = useRef(new Map());

  const scrollToLatestSageMessage = useCallback((sageKey) => {
    const last = [...messages].reverse().find((m) => m.role === "sage" && m.sageKey === sageKey);
    if (!last) return;
    const el = messageRefs.current.get(last.id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [messages]);

  const { events, status, error: streamError } = useSSE(`/sessions/${id}/stream`, { enabled: Boolean(id) });

  const sendMessage = useMutation({
    mutationFn: (content) => sendSessionMessage(id, content),
  });

  useEffect(() => {
    const pending = events.slice(processedEvents.current);
    if (!pending.length) return;

    pending.forEach((event) => {
      if (event.type === "active_sage") {
        const sageKey = event.data.sage_id || event.data.sage_key || event.data.key;
        const nextRound = Number(event.data.round);
        setActiveSageKey(sageKey || null);
        setAwaitingReply(Boolean(event.data.awaiting_reply));
        if (Number.isFinite(nextRound)) setRound(Math.max(1, Math.min(2, nextRound)));
      }

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

      if (event.type === "verdict_reaction") {
        const sageKey = event.data.sage_id || event.data.sage_key || event.data.key;
        const sage = sagesByKey.get(sageKey);
        if (event.data.reaction) {
          setMessages((current) => [
            ...current,
            {
              id: makeId("reaction"),
              role: "sage",
              sageKey,
              sageName: sage?.name || "The Council",
              content: event.data.reaction,
              streaming: false,
            },
          ]);
        }
      }

      if (event.type === "done" || event.type === "report_ready") {
        setReportReady(true);
        setActiveSageKey(null);
        setAwaitingReply(false);
        setMessages((current) => current.map((message) => ({ ...message, streaming: false })));
      }
    });

    processedEvents.current = events.length;
  }, [events, sagesByKey]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (introPhase !== "order") return;
    const t1 = setTimeout(() => setIntroPhase("begin"), 2200);
    return () => clearTimeout(t1);
  }, [introPhase]);

  useEffect(() => {
    if (introPhase !== "begin") return;
    const t2 = setTimeout(() => setIntroPhase("done"), 2000);
    return () => clearTimeout(t2);
  }, [introPhase]);

  const handleSend = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || sendMessage.isPending) return;

    setMessages((current) => [...current, { id: makeId("user"), role: "user", content }]);
    setInput("");
    setAwaitingReply(false);
    sendMessage.mutate(content);
  };

  return (
    <PageShell ambience={false}>
      {introPhase !== "done" && (
        <div className={`council-intro-overlay ${introPhase === "begin" ? "council-intro-exit" : ""}`}>
          <div className="council-intro-inner">
            <svg className="council-intro-seal" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
              <circle cx="45" cy="45" r="42" fill="none" stroke="#c49a2e" strokeWidth="1.5" strokeDasharray="8 5" />
              <circle cx="45" cy="45" r="33" fill="none" stroke="#c49a2e" strokeWidth="0.8" opacity="0.5" />
              <rect x="30" y="24" width="30" height="14" rx="5" fill="#4a2e0e" stroke="#c49a2e" strokeWidth="1.5" />
              <rect x="39" y="38" width="12" height="26" rx="4" fill="#6a4418" stroke="#8a5820" strokeWidth="1.2" />
              <rect x="18" y="60" width="54" height="10" rx="4" fill="#4a2e0e" stroke="#c49a2e" strokeWidth="1.5" />
            </svg>

            {introPhase === "order" && (
              <div className="council-intro-text animate-fadeIn">
                <p className="council-intro-label">The Council</p>
                <h1 className="council-intro-heading">Is Now in Order</h1>
                <div className="council-intro-rule" />
                <div className="council-intro-members">
                  {sages.map((sage, i) => (
                    <span key={sage.key} className="council-intro-member" style={{ animationDelay: `${0.3 + i * 0.2}s`, color: sage.avatarColor }}>
                      {sage.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {introPhase === "begin" && (
              <div className="council-intro-text animate-fadeIn">
                <h1 className="council-intro-heading" style={{ fontSize: "2rem" }}>Please state your case,</h1>
                <p className="council-intro-label" style={{ fontSize: "1.5rem", marginTop: 8 }}>Founder.</p>
                <div className="council-intro-rule" />
                <p className="council-intro-sub">The judges are listening.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.05] px-3 py-1.5 text-sm text-foreground/60">
              <Wifi className="h-4 w-4 text-gold" />
              {status === "open" ? "Live stream connected" : "Connecting stream"}
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">Live Session</h1>
            <p className="mt-2 text-sm text-foreground/50">Round {round} of 2</p>
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

        <CouncilBench sages={sages} verdicts={verdicts} activeSageKey={activeSageKey} messages={messages} onBubbleClick={scrollToLatestSageMessage} />

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

        <Card className="flex min-h-0 flex-1 flex-col bg-white">
          <CardHeader className="border-b border-black/[0.08] pb-4">
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
                    <div
                      key={message.id}
                      ref={(el) => { if (el) messageRefs.current.set(message.id, el); else messageRefs.current.delete(message.id); }}
                      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && sage ? <SageMiniAvatar sage={sage} /> : null}
                      <div
                        className={`max-w-[min(720px,85%)] rounded-2xl border px-4 py-3 ${
                          isUser
                            ? "rounded-br-sm border-[#4f46e5]/20 bg-[#4f46e5]/[0.08] text-foreground"
                            : "rounded-bl-sm border-black/[0.08] bg-white text-foreground/85 shadow-sm"
                        }`}
                      >
                        {!isUser ? (
                          <div className="mb-1 text-xs font-semibold" style={{ color: sage?.avatarColor || "#c49a2e" }}>
                            {message.sageName || sage?.name || "The Council"}
                          </div>
                        ) : null}
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.content}
                          {message.streaming ? <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-gold align-middle" /> : null}
                        </p>
                      </div>
                      {isUser ? <UserAvatar /> : null}
                    </div>
                  );
                })
              )}
              <div ref={feedEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-3 border-t border-black/[0.08] p-4">
              <Input
                value={input}
                placeholder={
                  activeSageKey
                    ? awaitingReply
                      ? `Reply to ${sagesByKey.get(activeSageKey)?.name || "the active sage"}...`
                      : `${sagesByKey.get(activeSageKey)?.name || "The active sage"} is asking...`
                    : "Waiting for the next sage..."
                }
                onChange={(event) => setInput(event.target.value)}
                disabled={sendMessage.isPending || reportReady || !activeSageKey || !awaitingReply}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || sendMessage.isPending || reportReady || !activeSageKey || !awaitingReply}
                aria-label="Send message"
              >
                {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
