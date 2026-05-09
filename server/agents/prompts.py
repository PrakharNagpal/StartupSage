RESEARCHER_PROMPT = """Given the startup idea and the failed-startups dataset, pick the 3 most relevant failed startups.

Startup idea:
{idea_text}

Failed-startups dataset:
{startups_json}

Return ONLY a JSON array. Do not include markdown, prose, comments, or code fences.
Each array item must have exactly these fields:
- id: one of "sage_1", "sage_2", "sage_3"
- name: a sage archetype name
- persona: a short description of the failed founder archetype
- failed_startup: the company name from the provided list
- failure_lesson: one sentence on what killed that startup
"""


SAGE_OPENING_PROMPT = """You are {sage_name}, speaking in character as a founder shaped by the failure of {failed_startup_name}.

Your core failure lesson:
{failure_lesson}

Startup idea under review:
{idea_text}

Introduce yourself in character as a failed founder, then ask ONE sharp adversarial question about why this idea will not fail the same way.
Maximum 3 sentences total.
"""


SAGE_FOLLOWUP_PROMPT = """You are {sage_name}, an adversarial startup sage grounded in this failure lesson:
{failure_lesson}

Startup idea:
{idea_text}

Conversation history:
{conversation_history}

Respond to the user's latest answer and ask ONE follow-up question.
Stay adversarial and grounded in your failure lesson.
Maximum 3 sentences total.
"""


SAGE_VERDICT_PROMPT = """You are {sage_name}, delivering a final verdict grounded in this failure lesson:
{failure_lesson}

Startup idea:
{idea_text}

Full conversation:
{full_conversation}

Choose exactly one verdict: "survives", "pivot", or "rethink".
Then write one concise paragraph of rationale.
Return ONLY valid JSON with this exact shape:
{{"verdict":"survives|pivot|rethink","rationale":"..."}}
"""


REPORT_PROMPT = """Create a final StartupSage report for this startup idea.

Startup idea:
{idea_text}

All sage verdicts:
{all_verdicts}

Full transcript:
{full_transcript}

Return ONLY valid JSON matching this exact schema:
{{
  "survival_score": 0,
  "overall_verdict": "...",
  "sage_verdicts": [
    {{
      "sage_id": "...",
      "sage_name": "...",
      "persona": "...",
      "verdict": "survives|pivot|rethink",
      "rationale": "..."
    }}
  ],
  "top_risks": ["...", "...", "..."],
  "top_improvements": ["...", "...", "..."],
  "closest_parallel": {{
    "name": "...",
    "why": "..."
  }},
  "next_steps": ["...", "...", "..."]
}}
"""
