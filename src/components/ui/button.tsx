import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base mirrors the admin portal's `.btn`: 13px / weight 600 / 0.1px
  // tracking, an 8px icon gap, and a fully rounded pill.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-semibold tracking-[0.1px] transition-all duration-200 ease-spring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary hover:bg-primary/85 hover:border-primary/85",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 hover:border-destructive/90",
        outline:
          "border border-border bg-card text-foreground shadow-sm hover:border-foreground hover:text-foreground",
        secondary:
          "bg-card text-foreground border border-border shadow-sm hover:border-foreground hover:text-foreground",
        ghost:
          "rounded-lg border border-transparent text-foreground/85 hover:bg-secondary hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        ai:
          "bg-primary text-primary-foreground border border-primary fleet-ask-glow hover:-translate-y-px",
      },
      size: {
        default: "h-9 px-[18px] py-2",
        sm: "h-8 px-3.5 text-[12.5px]",
        lg: "h-10 px-[22px] text-[14px]",
        icon: "h-9 w-9 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
