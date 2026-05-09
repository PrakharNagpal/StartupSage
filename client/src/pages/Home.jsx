import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import PageShell from "../components/layout/PageShell.jsx";
import { Button } from "../components/ui/button.jsx";

const JUDGES = [
  {
    name: "The Distribution Skeptic",
    startup: "Quibi",
    lens: "Audience behavior & acquisition",
    color: "#c49a2e",
    tilt: "-3deg",
    scale: "0.93",
  },
  {
    name: "The Timing Realist",
    startup: "Webvan",
    lens: "Market readiness & timing",
    color: "#2aa898",
    tilt: "0deg",
    scale: "1",
  },
  {
    name: "The Unit Economics Hawk",
    startup: "Jawbone",
    lens: "Margins, payback & retention",
    color: "#b83e2f",
    tilt: "3deg",
    scale: "0.93",
  },
];

function HomeJudge({ judge }) {
  const c = judge.color;
  return (
    <svg viewBox="0 0 90 170" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block" }}>
      {/* throne chair back */}
      <path d="M12 125 L12 50 Q12 16 45 10 Q78 16 78 50 L78 125 Z" fill="#4a2e0e" stroke="#7a5020" strokeWidth="1.8" />
      <path d="M19 122 L19 54 Q19 26 45 20 Q71 26 71 54 L71 122 Z" fill="#3a2208" stroke={c} strokeWidth="1.2" />
      <line x1="45" y1="22" x2="45" y2="120" stroke={c} strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="22" y1="70" x2="68" y2="70" stroke={c} strokeWidth="0.7" strokeOpacity="0.4" />
      <line x1="22" y1="90" x2="68" y2="90" stroke={c} strokeWidth="0.7" strokeOpacity="0.4" />
      <circle cx="45" cy="10" r="7" fill="#7a5020" stroke={c} strokeWidth="1.8" />
      <circle cx="45" cy="10" r="3.5" fill={c} />
      <circle cx="12" cy="50" r="4.5" fill="#7a5020" stroke={c} strokeWidth="1.4" />
      <circle cx="12" cy="50" r="2" fill={c} />
      <circle cx="78" cy="50" r="4.5" fill="#7a5020" stroke={c} strokeWidth="1.4" />
      <circle cx="78" cy="50" r="2" fill={c} />

      {/* wig side curls */}
      <ellipse cx="20" cy="70" rx="12" ry="18" fill="#edeae0" stroke="#ccc8ba" strokeWidth="1" />
      <ellipse cx="70" cy="70" rx="12" ry="18" fill="#edeae0" stroke="#ccc8ba" strokeWidth="1" />
      <path d="M13 58 Q17 62 13 67 Q17 72 13 77 Q17 82 13 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
      <path d="M20 58 Q24 62 20 67 Q24 72 20 77 Q24 82 20 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
      <path d="M63 58 Q67 62 63 67 Q67 72 63 77 Q67 82 63 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
      <path d="M70 58 Q74 62 70 67 Q74 72 70 77 Q74 82 70 87" stroke="#ccc8ba" strokeWidth="0.9" fill="none" />
      {/* wig top */}
      <ellipse cx="45" cy="48" rx="26" ry="21" fill="#edeae0" stroke="#ccc8ba" strokeWidth="1.2" />
      <path d="M26 42 Q31 38 36 42 Q41 38 46 42 Q51 38 56 42 Q61 38 66 42" stroke="#ccc8ba" strokeWidth="1" fill="none" />
      <path d="M24 49 Q29 45 34 49 Q39 45 44 49 Q49 45 54 49 Q59 45 64 49" stroke="#ccc8ba" strokeWidth="1" fill="none" />

      {/* face */}
      <ellipse cx="45" cy="62" rx="18" ry="20" fill="#f6d09a" stroke="#e0a860" strokeWidth="1.2" />
      {/* eyebrows */}
      <path d="M31 52 Q36 51 41 52" stroke="#8a5828" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M49 52 Q54 51 59 52" stroke="#8a5828" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <ellipse cx="36" cy="60" rx="6" ry="6.5" fill="white" stroke="#555" strokeWidth="1" />
      <ellipse cx="54" cy="60" rx="6" ry="6.5" fill="white" stroke="#555" strokeWidth="1" />
      <circle cx="36" cy="60.5" r="3.8" fill="#1a0800" />
      <circle cx="54" cy="60.5" r="3.8" fill="#1a0800" />
      <circle cx="37.8" cy="58.9" r="1.5" fill="white" />
      <circle cx="55.8" cy="58.9" r="1.5" fill="white" />
      {/* nose */}
      <ellipse cx="45" cy="68" rx="2.8" ry="2" fill="#e09858" opacity="0.55" />
      {/* neutral mouth */}
      <line x1="37" y1="75" x2="53" y2="75" stroke="#c06830" strokeWidth="2" strokeLinecap="round" />
      {/* cheek blush */}
      <ellipse cx="29" cy="67" rx="5.5" ry="3.5" fill="#f08060" opacity="0.2" />
      <ellipse cx="61" cy="67" rx="5.5" ry="3.5" fill="#f08060" opacity="0.2" />

      {/* robe */}
      <path d="M18 80 L5 125 L85 125 L72 80 Q45 75 18 80 Z" fill="#141414" />
      <path d="M18 80 Q45 75 72 80 Q58 77 45 77 Q32 77 18 80 Z" fill="#2c2c2c" />
      <path d="M18 80 L34 80 L28 100 L5 125 Z" fill="#1e1e1e" />
      <path d="M72 80 L56 80 L62 100 L85 125 Z" fill="#1e1e1e" />
      {/* jabot */}
      <path d="M34 80 L32 100 Q45 106 58 100 L56 80 Q45 84 34 80 Z" fill="white" stroke="#ddd" strokeWidth="0.8" />
      <path d="M34 85 Q45 89 56 85" stroke="#e0e0e0" strokeWidth="0.8" fill="none" />
      <path d="M33 92 Q45 96 57 92" stroke="#e0e0e0" strokeWidth="0.8" fill="none" />
      <path d="M32 100 Q45 108 58 100 Q51 110 45 112 Q39 110 32 100 Z" fill="white" stroke="#ddd" strokeWidth="0.8" />

      {/* seat */}
      <rect x="4" y="123" width="82" height="13" rx="6" fill="#5a3610" stroke="#8a5820" strokeWidth="1.8" />
      <rect x="8" y="125" width="74" height="8" rx="4" fill={`${c}22`} stroke={c} strokeWidth="0.9" />
      {/* legs */}
      <rect x="16" y="135" width="7" height="24" rx="2.5" fill="#6a4418" stroke="#8a5820" strokeWidth="1.2" />
      <rect x="67" y="135" width="7" height="24" rx="2.5" fill="#6a4418" stroke="#8a5820" strokeWidth="1.2" />
      <rect x="9" y="135" width="8" height="30" rx="3.5" fill="#7a5020" stroke="#9a6830" strokeWidth="1.4" />
      <rect x="73" y="135" width="8" height="30" rx="3.5" fill="#7a5020" stroke="#9a6830" strokeWidth="1.4" />
      <rect x="9" y="160" width="72" height="5" rx="2.5" fill="#5a3610" stroke="#8a5820" strokeWidth="1.1" />
    </svg>
  );
}

function CourtSeal() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="home-seal">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#c49a2e" strokeWidth="1.5" strokeDasharray="7 4" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#c49a2e" strokeWidth="0.8" opacity="0.5" />
      <circle cx="50" cy="50" r="30" fill="rgba(196,154,46,0.06)" stroke="#c49a2e" strokeWidth="0.6" />
      {/* scales of justice */}
      <line x1="50" y1="28" x2="50" y2="72" stroke="#c49a2e" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="34" y1="38" x2="66" y2="38" stroke="#c49a2e" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M34 38 Q29 44 34 50 Q39 44 34 38 Z" fill="none" stroke="#c49a2e" strokeWidth="1.3" />
      <path d="M66 38 Q61 44 66 50 Q71 44 66 38 Z" fill="none" stroke="#c49a2e" strokeWidth="1.3" />
      <rect x="44" y="70" width="12" height="4" rx="2" fill="#c49a2e" />
    </svg>
  );
}

export default function Home() {
  return (
    <PageShell className="flex flex-col justify-center">
      <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-6xl flex-col items-center justify-between gap-0 py-8">

        {/* Court header */}
        <div className="home-court-top animate-fadeIn">
          <CourtSeal />
          <div className="home-court-title-block">
            <p className="home-court-eyebrow">Est. in the Age of Failed Ventures</p>
            <h2 className="home-court-name">The Founder&rsquo;s Council</h2>
            <p className="home-court-decree">
              A tribunal of founders who learned the hardest way.
            </p>
          </div>
          <CourtSeal />
        </div>

        {/* Decorative rule */}
        <div className="home-rule" />

        {/* Judge bench */}
        <div className="home-bench-wrapper animate-fadeIn" style={{ animationDelay: "80ms" }}>
          <div className="home-bench-seats">
            {JUDGES.map((judge, i) => (
              <div
                key={judge.name}
                className="home-bench-seat animate-fadeIn"
                style={{
                  animationDelay: `${120 + i * 100}ms`,
                  transform: `rotate(${judge.tilt}) scale(${judge.scale})`,
                  transformOrigin: "bottom center",
                  zIndex: i === 1 ? 2 : 1,
                }}
              >
                <div className="home-judge-figure">
                  <HomeJudge judge={judge} />
                </div>
              </div>
            ))}
          </div>

          {/* Bench face — spans all 3 */}
          <div className="home-bench-face" />

          {/* Nameplates row below bench */}
          <div className="home-nameplates-row">
            {JUDGES.map((judge) => (
              <div key={judge.name} className="home-nameplate-block">
                <div className="home-nameplate-card" style={{ borderColor: `${judge.color}44` }}>
                  <span className="home-nameplate-name" style={{ color: judge.color }}>{judge.name}</span>
                  <span className="home-nameplate-lens">{judge.lens}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative rule */}
        <div className="home-rule" />

        {/* Title + CTA */}
        <div className="home-cta-block animate-fadeIn" style={{ animationDelay: "320ms" }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
            Court is in Session
          </div>
          <h1 className="home-main-title">StartupSage</h1>
          <p className="home-main-sub">
            Your idea, judged by the founders who failed before you.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="mt-6 w-full max-w-xs text-base" aria-label="Submit your startup idea">
              <Link to="/submit">
                Submit Your Case
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

      </section>
    </PageShell>
  );
}
