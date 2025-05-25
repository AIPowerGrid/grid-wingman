import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "src/background/util"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none not-focus-visible",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 not-focus-visible",
        outline:
          "border bg-background shadow-xs hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        "message-action":
          "bg-transparent text-muted-foreground p-0 shadow-none hover:bg-transparent focus:bg-transparent active:text-muted active:[&_svg]:text-muted-foreground transition-colors duration-75",      },
      size: {
        default: "h-9 px-2 py-2 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-5", // Default icons are size-5 (1.25rem)
        sm: "h-8 rounded-md px-2 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-4",    // Small icons are size-4 (1rem)
        lg: "h-10 rounded-md px-2 py-2 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-5",    // Large icons are size-5 (1.25rem), adjust if needed e.g. to size-6
        icon: "size-8 [&_svg:not([class*='size-'])]:size-7",
        xs: "h-6 w-6 p-0 rounded-sm [&_svg:not([class*='size-'])]:size-3.5 text-xs", // Extra small
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
