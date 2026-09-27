import { cn } from "../../lib/utils";

export function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn("flex h-12 w-full rounded-xl border-2 border-input bg-card px-3.5 py-3 text-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  );
}
