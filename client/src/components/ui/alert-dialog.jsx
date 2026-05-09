import { cn } from "../../lib/utils.js";
import { Button } from "./button.jsx";

export function AlertDialog({ open, onOpenChange, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" role="presentation">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

export function AlertDialogContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-md rounded-lg border border-white/10 bg-[#111] p-6 shadow-2xl",
        className,
      )}
      role="alertdialog"
      aria-modal="true"
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDialogHeader({ className, ...props }) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold text-white", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }) {
  return <p className={cn("text-sm leading-6 text-white/65", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function AlertDialogCancel({ children = "Cancel", onClick, ...props }) {
  return (
    <Button variant="secondary" onClick={onClick} {...props}>
      {children}
    </Button>
  );
}

export function AlertDialogAction({ children, onClick, variant = "destructive", ...props }) {
  return (
    <Button variant={variant} onClick={onClick} {...props}>
      {children}
    </Button>
  );
}
