import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-[0.02em] transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-border bg-card text-foreground/85",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive)/0.08)] text-destructive",
        outline:
          "border-border text-foreground",
        success:
          "border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] text-success",
        warning:
          "border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning)/0.10)] text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
