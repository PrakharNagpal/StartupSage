import { cn } from "../../lib/utils.js";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-white/10 bg-black/[0.35] px-4 text-sm text-white outline-none transition placeholder:text-white/[0.35] focus:border-gold/[0.55] focus:ring-2 focus:ring-gold/15",
        className,
      )}
      {...props}
    />
  );
}
