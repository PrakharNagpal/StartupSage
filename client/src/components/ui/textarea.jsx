import { cn } from "../../lib/utils.js";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-lg border border-white/10 bg-black/[0.35] px-4 py-3 text-sm leading-6 text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-white/[0.35] focus:border-gold/[0.55] focus:ring-2 focus:ring-gold/15",
        className,
      )}
      {...props}
    />
  );
}
