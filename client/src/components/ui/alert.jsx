import { AlertCircle } from "lucide-react";

import { cn } from "../../lib/utils.js";

const variants = {
  default: "border-black/[0.08] bg-black/[0.03] text-foreground",
  destructive: "border-red-400/25 bg-red-500/[0.08] text-red-700",
};

export function Alert({ className, variant = "default", children, ...props }) {
  return (
    <div className={cn("relative rounded-lg border p-4", variants[variant], className)} {...props}>
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 space-y-1">{children}</div>
      </div>
    </div>
  );
}

export function AlertTitle({ className, ...props }) {
  return <h5 className={cn("font-semibold leading-none", className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn("text-sm leading-6 opacity-86", className)} {...props} />;
}
