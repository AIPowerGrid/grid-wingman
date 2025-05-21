import * as React from "react"
import { cn } from "@/src/background/util"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-8 w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-sm transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border border-[var(--text)]/10",
        "focus-visible:border-ring",
        "text-[var(--text)] px-2.5",
        "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)] focus:ring-offset-0",
        "hover:border-[var(--active)]",
        "bg-[rgba(255,250,240,0.4)] dark:bg-[rgba(255,255,255,0.1)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "shadow-[0_4px_24px_0_rgba(0,0,0,0.12)]",
        className,
        isFocused && "input-breathing"
      )}
      onFocus={e => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={e => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      {...props}
    />
  )
}

export { Input }
