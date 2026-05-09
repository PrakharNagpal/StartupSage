import { cn } from "../../lib/utils.js";

export default function PageShell({ children, className, ambience = true }) {
  return (
    <main className={cn("route-shell bg-background text-foreground", className)}>
      {ambience ? <div className="ambient-gradient" aria-hidden="true" /> : null}
      {children}
    </main>
  );
}
