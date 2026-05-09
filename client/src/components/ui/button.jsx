import { cva } from "class-variance-authority";
import { cloneElement, isValidElement } from "react";

import { cn } from "../../lib/utils.js";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "bg-gold text-black shadow-gold hover:bg-[#e2bd62]",
        secondary: "border border-white/10 bg-white/[0.08] text-foreground hover:bg-white/[0.12]",
        ghost: "text-gold hover:bg-gold/10",
        destructive: "bg-red-500 text-white hover:bg-red-400",
        outline: "border border-gold/[0.35] bg-transparent text-gold hover:bg-gold/10",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({ className, variant, size, type = "button", asChild = false, children, ...props }) {
  const composedClassName = cn(buttonVariants({ variant, size }), className);

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: cn(composedClassName, children.props.className),
      ...props,
    });
  }

  return (
    <button type={type} className={composedClassName} {...props}>
      {children}
    </button>
  );
}
