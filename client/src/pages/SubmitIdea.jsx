import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import PageShell from "../components/layout/PageShell.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.jsx";
import { Button } from "../components/ui/button.jsx";
import { Textarea } from "../components/ui/textarea.jsx";
import { createSession, researchSession } from "../lib/api.js";
import { defaultSages, saveSessionSages } from "../lib/sages.js";

const maxCharacters = 500;
const demoIdea =
  "An AI-powered meal planning app that generates weekly grocery lists and recipes based on your dietary preferences and budget, then auto-orders from Instacart.";

const PANEL = [
  { name: "The Distribution Skeptic", lens: "Audience & acquisition", color: "#c49a2e" },
  { name: "The Timing Realist",       lens: "Market readiness",       color: "#2aa898" },
  { name: "The Unit Economics Hawk",  lens: "Margins & retention",    color: "#b83e2f" },
];

const PROCEEDINGS = [
  { step: "I",   label: "Opening examination",   desc: "Each judge questions your core assumptions." },
  { step: "II",  label: "Cross-examination",      desc: "You respond and defend your position." },
  { step: "III", label: "Verdict & rationale",    desc: "The council delivers its final judgment." },
];

function MiniJudge({ color }) {
  const c = color;
  return (
    <svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, display: "block" }}>
      {/* chair back */}
      <path d="M8 72 L8 28 Q8 8 30 4 Q52 8 52 28 L52 72 Z" fill="#4a2e0e" stroke="#7a5020" strokeWidth="1.2" />
      <path d="M13 70 L13 31 Q13 14 30 11 Q47 14 47 31 L47 70 Z" fill="#3a2208" stroke={c} strokeWidth="0.8" />
      <circle cx="30" cy="4" r="5" fill="#7a5020" stroke={c} strokeWidth="1.2" />
      <circle cx="30" cy="4" r="2.2" fill={c} />
      <circle cx="8" cy="28" r="3" fill="#7a5020" stroke={c} strokeWidth="1" />
      <circle cx="52" cy="28" r="3" fill="#7a5020" stroke={c} strokeWidth="1" />
      {/* wig */}
      <ellipse cx="14" cy="40" rx="8" ry="12" fill="#edeae0" stroke="#ccc8ba" strokeWidth="0.8" />
      <ellipse cx="46" cy="40" rx="8" ry="12" fill="#edeae0" stroke="#ccc8ba" strokeWidth="0.8" />
      <ellipse cx="30" cy="28" rx="17" ry="14" fill="#edeae0" stroke="#ccc8ba" strokeWidth="0.9" />
      <path d="M18 24 Q22 21 26 24 Q30 21 34 24 Q38 21 42 24" stroke="#ccc8ba" strokeWidth="0.7" fill="none" />
      {/* face */}
      <ellipse cx="30" cy="38" rx="12" ry="13" fill="#f6d09a" stroke="#e0a860" strokeWidth="0.9" />
      <ellipse cx="24" cy="36" rx="3.8" ry="4.2" fill="white" stroke="#555" strokeWidth="0.7" />
      <ellipse cx="36" cy="36" rx="3.8" ry="4.2" fill="white" stroke="#555" strokeWidth="0.7" />
      <circle cx="24" cy="37" r="2.4" fill="#1a0800" />
      <circle cx="36" cy="37" r="2.4" fill="#1a0800" />
      <circle cx="25" cy="35.5" r="1" fill="white" />
      <circle cx="37" cy="35.5" r="1" fill="white" />
      <line x1="25" y1="46" x2="35" y2="46" stroke="#c06830" strokeWidth="1.4" strokeLinecap="round" />
      {/* robe */}
      <path d="M13 50 L5 72 L55 72 L47 50 Q30 46 13 50 Z" fill="#141414" />
      <path d="M22 50 L21 63 Q30 67 39 63 L38 50 Q30 53 22 50 Z" fill="white" stroke="#ddd" strokeWidth="0.6" />
      {/* seat */}
      <rect x="3" y="70" width="54" height="8" rx="4" fill="#5a3610" stroke="#8a5820" strokeWidth="1.2" />
    </svg>
  );
}

function CourtSealSmall() {
  return (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style={{ width: 44, height: 44, opacity: 0.8 }}>
      <circle cx="30" cy="30" r="27" fill="none" stroke="#c49a2e" strokeWidth="1.2" strokeDasharray="5 3" />
      <circle cx="30" cy="30" r="21" fill="none" stroke="#c49a2e" strokeWidth="0.7" opacity="0.5" />
      <line x1="30" y1="14" x2="30" y2="46" stroke="#c49a2e" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="20" y1="22" x2="40" y2="22" stroke="#c49a2e" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M20 22 Q16 27 20 32 Q24 27 20 22 Z" fill="none" stroke="#c49a2e" strokeWidth="1" />
      <path d="M40 22 Q36 27 40 32 Q44 27 40 22 Z" fill="none" stroke="#c49a2e" strokeWidth="1" />
      <rect x="26" y="44" width="8" height="3" rx="1.5" fill="#c49a2e" />
    </svg>
  );
}

function SummoningScreen() {
  return (
    <div className="summon-overlay">
      <div className="summon-content">
        <svg className="summon-gavel" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#c49a2e" strokeWidth="1.5" strokeDasharray="6 4" />
          <circle cx="40" cy="40" r="28" fill="none" stroke="#c49a2e" strokeWidth="0.8" opacity="0.5" />
          <rect x="28" y="22" width="24" height="12" rx="4" fill="#4a2e0e" stroke="#c49a2e" strokeWidth="1.2" />
          <rect x="35" y="34" width="10" height="22" rx="3" fill="#6a4418" stroke="#8a5820" strokeWidth="1" />
          <rect x="20" y="52" width="40" height="8" rx="3" fill="#4a2e0e" stroke="#c49a2e" strokeWidth="1.2" />
        </svg>
        <h1 className="summon-title">Summoning the Council</h1>
        <p className="summon-sub">Your judges are convening&hellip;</p>
        <div className="summon-judges">
          {PANEL.map((j, i) => (
            <div key={j.name} className="summon-judge-chip" style={{ animationDelay: `${i * 0.22}s` }}>
              {j.name}
            </div>
          ))}
        </div>
        <div className="summon-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default function SubmitIdea() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");

  const submitIdea = useMutation({
    mutationFn: async () => {
      const trimmed = idea.trim();
      const created = await createSession(trimmed);
      const researchedSages = await researchSession(created.sessionId);
      const sages = researchedSages.length ? researchedSages : created.sages || defaultSages;
      saveSessionSages(created.sessionId, sages);
      return created.sessionId;
    },
    onSuccess: (sessionId) => navigate(`/session/${sessionId}`),
  });

  const remaining = maxCharacters - idea.length;
  const isReady = idea.trim().length >= 12 && idea.length <= maxCharacters && !submitIdea.isPending;

  return (
    <PageShell>
      {submitIdea.isPending && <SummoningScreen />}

      <div className="submit-page">

        {/* Back */}
        <div className="submit-back animate-fadeIn">
          <Button asChild variant="ghost" className="px-0 text-foreground/60 hover:text-foreground">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to Council</Link>
          </Button>
        </div>

        {/* Page header */}
        <div className="submit-header animate-fadeIn">
          <CourtSealSmall />
          <div>
            <p className="submit-header-eyebrow">Open Session</p>
            <h1 className="submit-header-title">State Your Case</h1>
          </div>
          <CourtSealSmall />
        </div>

        <div className="submit-rule" />

        {/* Main 2-col */}
        <div className="submit-body">

          {/* Left: panel preview + proceedings */}
          <div className="submit-left animate-fadeIn" style={{ animationDelay: "80ms" }}>

            <div className="submit-panel-section">
              <p className="submit-section-label">Your Panel</p>
              <div className="submit-panel-judges">
                {PANEL.map((j) => (
                  <div key={j.name} className="submit-panel-judge">
                    <MiniJudge color={j.color} />
                    <div className="submit-panel-info">
                      <span className="submit-panel-name" style={{ color: j.color }}>{j.name}</span>
                      <span className="submit-panel-lens">{j.lens}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="submit-rule" style={{ maxWidth: "100%" }} />

            <div className="submit-proceedings-section">
              <p className="submit-section-label">Proceedings</p>
              <div className="submit-proceedings">
                {PROCEEDINGS.map((p) => (
                  <div key={p.step} className="submit-proceeding">
                    <span className="submit-proceeding-step">§{p.step}</span>
                    <div>
                      <div className="submit-proceeding-label">{p.label}</div>
                      <div className="submit-proceeding-desc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: petition form */}
          <div className="submit-right animate-fadeIn" style={{ animationDelay: "140ms" }}>
            <div className="submit-petition">
              <div className="submit-petition-header">
                <div>
                  <p className="submit-petition-eyebrow">Case Submission</p>
                  <p className="submit-petition-sub">Present your startup idea in clear terms. The council will question every assumption.</p>
                </div>
              </div>

              <form
                className="submit-form"
                onSubmit={(e) => { e.preventDefault(); if (isReady) submitIdea.mutate(); }}
              >
                <div className="submit-field">
                  <label className="submit-field-label">Statement of Your Case</label>
                  <Textarea
                    value={idea}
                    maxLength={maxCharacters}
                    placeholder="Describe your startup idea in 2–3 sentences. What problem does it solve, who is it for, and how does it work?"
                    className="submit-textarea"
                    onChange={(e) => setIdea(e.target.value)}
                  />
                  <div className="submit-field-footer">
                    <span className={remaining < 60 ? "text-ember" : ""}>{remaining} characters remaining</span>
                    <span className={idea.trim().length >= 12 ? "text-teal font-semibold" : ""}>
                      {idea.trim().length < 12 ? "Minimum 12 characters" : "✓ Ready to submit"}
                    </span>
                  </div>
                </div>

                {submitIdea.isError && (
                  <Alert variant="destructive">
                    <AlertTitle>Could not summon the council</AlertTitle>
                    <AlertDescription>{submitIdea.error?.message || "Check the backend and try again."}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" size="lg" disabled={!isReady} className="submit-btn">
                  <Sparkles className="h-5 w-5" />
                  Present to the Council
                </Button>

                <button
                  type="button"
                  className="submit-demo-link"
                  onClick={() => setIdea(demoIdea)}
                  disabled={submitIdea.isPending}
                >
                  Or try a demo idea
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
