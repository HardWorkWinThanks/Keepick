import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className, variant = "primary", size = "md", ...props }, ref) => {
  const variantStyles = {
    primary: {
      button: "text-white/80",
      dot: "bg-[#FE7A25]",
      text: "text-white/80",
      hoverText: "text-[#FE7A25]"
    },
    secondary: {
      button: "text-[#F5E7C6]/80",
      dot: "bg-[#F5E7C6]",
      text: "text-[#F5E7C6]/80",
      hoverText: "text-[#F5E7C6]"
    },
    ghost: {
      button: "text-white",
      dot: "bg-white",
      text: "text-white",
      hoverText: "text-[#FE7A25]"
    }
  };

  const sizeStyles = {
    sm: {
      button: "p-1.5 px-4 text-sm",
      dot: "h-1.5 w-1.5"
    },
    md: {
      button: "p-2 px-6 text-base",
      dot: "h-2 w-2"
    },
    lg: {
      button: "p-3 px-8 text-lg",
      dot: "h-2.5 w-2.5"
    }
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden font-keepick-primary tracking-wide transition-all duration-300 bg-transparent",
        currentVariant.button,
        currentSize.button,
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          "rounded-full transition-all duration-300 group-hover:scale-[100.8] group-hover:opacity-0",
          currentVariant.dot,
          currentSize.dot
        )}></div>
        <span className={cn(
          "inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0",
          currentVariant.text
        )}>
          {children}
        </span>
      </div>
      <div className={cn(
        "absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100 bg-[#111111]",
        currentVariant.hoverText
      )}>
        <span>{children}</span>
        <ArrowRight size={currentSize.dot === "h-1.5 w-1.5" ? 14 : currentSize.dot === "h-2 w-2" ? 16 : 18} />
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";