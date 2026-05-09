import { cn } from "../../lib/utils.js";

const variants = {
  default: "border-transparent bg-white/10 text-white",
  survives: "border-emerald-400/25 bg-emerald-400/[0.12] text-emerald-200",
  pivot: "border-gold/30 bg-gold/[0.12] text-gold",
  rethink: "border-red-400/25 bg-red-400/[0.12] text-red-200",
  outline: "border-white/[0.14] text-white/[0.72]",
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
