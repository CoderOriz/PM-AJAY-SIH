import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full mt-2.5 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border-2 border-primary bg-card text-primary hover:bg-primary/10",
        secondary: "border-2 border-secondary bg-card text-secondary hover:bg-secondary/10",
        ghost: "text-muted-foreground underline text-sm font-normal h-auto py-1",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "px-4 py-4",
        sm: "px-3 py-1.5 text-sm rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
