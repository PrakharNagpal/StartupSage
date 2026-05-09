import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import PageShell from "../components/layout/PageShell.jsx";
import { Button } from "../components/ui/button.jsx";

export default function Home() {
  return (
    <PageShell className="flex items-center">
      <section className="mx-auto grid min-h-[calc(100vh-56px)] w-full max-w-6xl grid-rows-[auto_1fr_auto] gap-7 py-6">
        <div className="flex items-center justify-center gap-4 pt-2 sm:gap-8">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="sage-silhouette animate-fadeIn"
              style={{ animationDelay: `${item * 120}ms` }}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="flex items-center justify-center">
          <div className="max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold">
              <Sparkles className="h-4 w-4" />
              Founder council
            </div>
            <h1 className="font-display text-6xl font-extrabold leading-[0.98] text-white sm:text-7xl md:text-8xl">
              StartupSage
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/[0.68] sm:text-xl">
              Your idea, judged by the founders who failed before you.
            </p>
            <div className="mt-9 flex justify-center">
              <Button asChild size="lg" className="min-w-48" aria-label="Submit your startup idea">
                <Link to="/submit">
                  Submit Your Idea
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-gold/[0.28] to-transparent" />
      </section>
    </PageShell>
  );
}
