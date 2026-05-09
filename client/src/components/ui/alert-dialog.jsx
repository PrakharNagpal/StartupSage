import { createPortal } from "react-dom";
import { cn } from "../../lib/utils.js";
import { Button } from "./button.jsx";

export function AlertDialog({ open, onOpenChange, children }) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="presentation"
      style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.38)" }}
    >
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      {children}
    </div>,
    document.body,
  );
}

export function AlertDialogContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-6 shadow-2xl",
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
  return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }) {
  return <p className={cn("text-sm leading-6 text-foreground/60", className)} {...props} />;
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

export function AlertDialogAction({ children, onClick, variant = "destructive", asChild, ...props }) {
  return (
    <Button variant={variant} onClick={onClick} asChild={asChild} {...props}>
      {children}
    </Button>
  );
}
