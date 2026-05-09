import { cn } from "../../lib/utils.js";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-black/[0.12] bg-white px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/[0.55] focus:ring-2 focus:ring-gold/15",
        className,
      )}
      {...props}
    />
  );
}
