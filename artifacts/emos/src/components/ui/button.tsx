import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(203,255,0,0.15)] hover:shadow-[0_0_30px_rgba(203,255,0,0.4)]",
  outline: "border border-white/10 bg-card hover:bg-white/5 text-white hover:border-white/30",
  ghost: "hover:bg-white/10 text-white",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-12 px-8 py-4",
  sm: "h-9 px-4",
  icon: "h-12 w-12",
};

const BASE = "inline-flex items-center justify-center whitespace-nowrap rounded-full font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: Pick<ButtonProps, "variant" | "size" | "className"> = {}) {
  return cn(BASE, variantClasses[variant], sizeClasses[size], className);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
