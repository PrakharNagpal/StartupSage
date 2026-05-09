import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Flame, Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import PageShell from "../components/layout/PageShell.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Textarea } from "../components/ui/textarea.jsx";
import { createSession, researchSession } from "../lib/api.js";
import { defaultSages, saveSessionSages } from "../lib/sages.js";

const maxCharacters = 500;
const demoIdea =
  "An AI-powered meal planning app that generates weekly grocery lists and recipes based on your dietary preferences and budget, then auto-orders from Instacart.";

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
    onSuccess: (sessionId) => {
      navigate(`/session/${sessionId}`);
    },
  });

  const remaining = maxCharacters - idea.length;
  const isReady = idea.trim().length >= 12 && idea.length <= maxCharacters && !submitIdea.isPending;

  return (
    <PageShell className="flex items-center">
      <section className="mx-auto grid w-full max-w-5xl gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="animate-fadeIn">
          <Button asChild variant="ghost" className="mb-7 px-0">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold">
            <Flame className="h-4 w-4" />
            Face the council
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight text-white sm:text-6xl">
            Put the idea under pressure.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/[0.64]">
            You will be challenged by 3 AI sages embodying real failed founders.
          </p>
        </div>

        <Card className="animate-fadeIn border-gold/[0.16] bg-[rgba(17,17,17,0.82)]">
          <CardHeader>
            <CardTitle>Submit Idea</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (isReady) submitIdea.mutate();
              }}
            >
              <div className="space-y-2">
                <Textarea
                  value={idea}
                  maxLength={maxCharacters}
                  placeholder="Describe your startup idea in 2-3 sentences..."
                  className="min-h-56 resize-none text-base"
                  onChange={(event) => setIdea(event.target.value)}
                />
                <div className="flex items-center justify-between gap-4 text-sm text-white/[0.48]">
                  <span>{remaining} characters remaining</span>
                  <span>{idea.trim().length < 12 ? "Minimum 12 characters" : "Ready"}</span>
                </div>
              </div>

              {submitIdea.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not summon the council</AlertTitle>
                  <AlertDescription>{submitIdea.error?.message || "Check the backend and try again."}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" size="lg" disabled={!isReady} className="sm:min-w-52">
                  {submitIdea.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {submitIdea.isPending ? "Summoning the council..." : "Face the Council"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIdea(demoIdea)}
                  disabled={submitIdea.isPending}
                >
                  Try a demo idea
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
