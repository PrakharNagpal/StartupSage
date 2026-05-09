import { defaultSages } from "./sages.js";

function stripMarkdown(value = "") {
  return value
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function markdownSection(markdown = "", title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`##\\s+${escaped}\\s*([\\s\\S]*?)(?=\\n##\\s+|$)`, "i"));
  return match ? stripMarkdown(match[1]) : "";
}

function markdownList(markdown = "", title) {
  return markdownSection(markdown, title)
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, ""))
    .filter(Boolean);
}

function firstNonEmptyArray(...values) {
  return values.find((value) => Array.isArray(value) && value.length > 0) || [];
}

function normalizeVerdict(value = "") {
  const lowered = String(value).toLowerCase();
  if (lowered.includes("survive") || lowered.includes("pass") || lowered.includes("validated")) return "survives";
  if (lowered.includes("rethink") || lowered.includes("reject") || lowered.includes("kill")) return "rethink";
  if (lowered.includes("pivot")) return "pivot";
  return lowered || "pending";
}

export function verdictBadgeVariant(value) {
  const normalized = normalizeVerdict(value);
  if (normalized === "survives") return "survives";
  if (normalized === "pivot") return "pivot";
  if (normalized === "rethink") return "rethink";
  return "outline";
}

export function verdictLabel(value) {
  const normalized = normalizeVerdict(value);
  if (normalized === "survives") return "Survives";
  if (normalized === "pivot") return "Pivot";
  if (normalized === "rethink") return "Rethink";
  return "Pending";
}

export function normalizeReport(payload = {}, sages = defaultSages) {
  const markdown = payload.markdown || "";
  const score = Number(payload.survival_score ?? payload.score ?? 0);
  console.log("report.survival_score", payload.survival_score);

  const councilSummary = payload.council_summary ||
    payload.councilSummary || {
      consensus:
        payload.overall_verdict ||
        payload.overallVerdict ||
        markdownSection(markdown, "Verdict Summary") ||
        "We have enough signal to continue, but the riskiest assumptions still need direct evidence.",
      what_we_liked: [
        "The founder brought a concrete idea into the council review.",
        "The conversation produced testable risks around distribution, timing, and unit economics.",
      ],
      verdict: payload.verdict || "pivot",
    };

  return {
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
    overallVerdict:
      payload.overall_verdict ||
      payload.overallVerdict ||
      markdownSection(markdown, "Verdict Summary") ||
      "The council has enough signal to continue, but the riskiest assumptions still need direct evidence.",
    councilSummary: {
      consensus: councilSummary.consensus || "We believe the idea needs more validation before scaling.",
      whatWeLiked: firstNonEmptyArray(councilSummary.what_we_liked, councilSummary.whatWeLiked, [
        "The founder brought a concrete idea into the council review.",
        "The conversation produced testable risks around distribution, timing, and unit economics.",
      ]),
      verdict: normalizeVerdict(councilSummary.verdict),
    },
    topRisks: firstNonEmptyArray(payload.top_risks, payload.topRisks, markdownList(markdown, "Top Risks"), [
        "Distribution assumptions are not yet proven.",
        "Market timing needs sharper evidence.",
        "Unit economics need a concrete payback model.",
      ]),
    topImprovements: firstNonEmptyArray(
      payload.top_improvements,
      payload.topImprovements,
      payload.suggested_improvements,
      payload.suggestedImprovements,
      [
        "Narrow the beachhead customer segment.",
        "Define one measurable acquisition channel.",
        "Model retention and support costs before building more product.",
      ],
    ),
    closestParallel: payload.closest_parallel ||
      payload.closestParallel || {
        name: "Historical pattern",
        why: "The idea should be compared against failures where demand existed but distribution, timing, or economics broke the business.",
      },
    nextSteps: firstNonEmptyArray(payload.next_steps, payload.nextSteps, markdownList(markdown, "Recommended Next Steps"), [
        "Interview five target customers.",
        "Write the riskiest assumption as a testable claim.",
        "Run a low-cost demand test before committing to build.",
      ]),
  };
}
