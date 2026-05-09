import { cn } from "../../lib/utils.js";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-lg border border-black/[0.12] bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-inner shadow-black/[0.05] outline-none transition placeholder:text-foreground/35 focus:border-gold/[0.55] focus:ring-2 focus:ring-gold/15",
        className,
      )}
      {...props}
    />
  );
}
