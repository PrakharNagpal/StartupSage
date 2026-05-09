import { cn } from "../../lib/utils.js";

export function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/10", className)} {...props} />;
}
