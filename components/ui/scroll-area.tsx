// scrollarea.ts
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/src/background/util"

// Main ScrollArea component
function ScrollArea({
  className,
  children,
  viewportRef,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & { viewportRef?: React.Ref<HTMLDivElement> }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area" // Kept your custom data-slot attribute
      className={cn("relative", className)} // Radix UI's Root component has overflow: hidden by default.
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport" // Kept your custom data-slot attribute
        className={cn(
          "size-full rounded-[inherit]", // Base styles
          "focus-visible:ring-ring/50 transition-[color,box-shadow] outline-none focus-visible:ring-[2px] focus-visible:outline-1", // Your existing focus and transition styles
          "pb-px pr-px" // MODIFIED: Added pb-px for horizontal scrollbar, kept pr-px for vertical
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />   {/* Use explicit orientation */}
      <ScrollBar orientation="horizontal" /> {/* ADDED: Horizontal scrollbar */}
      <ScrollAreaPrimitive.Corner /> {/* Handles the corner where scrollbars meet */}
    </ScrollAreaPrimitive.Root>
  )
}

// ScrollBar sub-component
function ScrollBar({
  className,
  orientation = "vertical", // Default orientation
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar" // Kept your custom data-slot attribute
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors", // Common styles for the scrollbar track
        orientation === "vertical" &&
          "h-full w-px", // Vertical scrollbar: full height, 1px width
        orientation === "horizontal" &&
          "h-px w-full", // MODIFIED: Horizontal scrollbar: 1px height, full width
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb" // Kept your custom data-slot attribute
        className="bg-border relative flex-1 rounded-sm" // Style for the thumb (the draggable part)
        />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }