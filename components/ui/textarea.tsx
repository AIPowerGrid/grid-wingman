import * as React from "react"
import AutosizeTextarea from "react-textarea-autosize"

import { cn } from "@/src/background/util"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  autosize?: boolean
  minRows?: number
  maxRows?: number
}

function Textarea({
  className,
  autosize = false,
  minRows,
  maxRows,
  ...props
}: TextareaProps) {
  if (autosize) {
    return (
      <AutosizeTextarea
        data-slot="textarea-autosize"
        minRows={minRows}
        maxRows={maxRows}
        className={cn(
          // Base styles for autosize mode (minimal)
          "flex w-full bg-transparent placeholder:text-muted-foreground",
          // Focus visible styles (can be kept or made conditional if needed)
          "focus-visible:border-ring focus-visible:ring-ring/50",
          // Specific styles for autosize that override defaults or provide new ones
          "field-sizing-content text-base md:text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Overrideable classes should come last
          className
        )}
        {...props}
      />
    )
  }

  return (
    <textarea
      data-slot="textarea-default"
      className={cn(
        // Default styles for standard textarea
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
