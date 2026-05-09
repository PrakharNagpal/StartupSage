import { cn } from "../../lib/utils.js";

const variants = {
  default: "border-transparent bg-black/[0.07] text-foreground",
  survives: "border-emerald-600/25 bg-emerald-500/[0.12] text-emerald-700",
  pivot: "border-gold/30 bg-gold/[0.12] text-amber-700",
  rethink: "border-red-400/25 bg-red-400/[0.10] text-red-700",
  outline: "border-black/[0.14] text-foreground/65",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    />
  );
}
