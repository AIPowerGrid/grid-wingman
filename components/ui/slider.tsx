import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/src/background/util"

// Define sliderClass outside the component if it's static
// This prevents it from being re-declared on every render.
const sliderRootStyles = cn(
  // Base styles for the root, w-full is important here
  "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
  // Your custom track, range, and thumb styles applied from the root
  "[&>span[data-slot=slider-track]]:bg-[var(--text)]/10", // Targets Track
  "[&>span[data-slot=slider-track]>span[data-slot=slider-range]]:bg-[var(--active)]", // Targets Range
  "[&>button[data-slot=slider-thumb]]:bg-[var(--active)]", // Targets Thumb
  "[&>button[data-slot=slider-thumb]]:border-[var(--text)]/50",
  "[&>button[data-slot=slider-thumb]]:ring-offset-[var(--bg)]",
  "[&>button[data-slot=slider-thumb]]:focus-visible:ring-[var(--active)]"
);


function Slider({
  className, // This prop allows consumers to add MORE classes if needed
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max], // Default to a single thumb at min if no values
    [value, defaultValue, min] // Removed max from deps as it's not used for single thumb default
  );


  return (
    <SliderPrimitive.Root
      data-slot="slider" // Keep data-slots if you use them for other styling/testing
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      // Merge the base styles, your custom styles, and any passed-in className
      className={cn(sliderRootStyles, className)}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        // The track's bg is now controlled by sliderRootStyles,
        // but keep other structural/orientation classes.
        className={cn(
          "relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary", // Default Shadcn track bg
          // Specific overrides for your theme if needed, but sliderRootStyles should handle it
          // For example, if you want the track itself to have a different base than var(--text)/10 before the range fills it:
          // "bg-[var(--text)]/10" // This is now handled by sliderRootStyles
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          // The range's bg is now controlled by sliderRootStyles
          className={cn(
            "absolute h-full bg-primary", // Default Shadcn range bg
            // "bg-[var(--active)]" // This is now handled by sliderRootStyles
            "data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {/* Ensure _values has at least one item for the map to work,
          or adjust logic if a slider can truly have zero thumbs.
          Radix slider typically expects at least one value.
      */}
      {(_values.length > 0 ? _values : [min]).map((_, index) => ( // Fallback to one thumb if _values is empty
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          // The thumb's bg and border are now controlled by sliderRootStyles
          className={cn(
            // Default Shadcn thumb styles (structural, transition, focus ring base)
            "block h-4 w-4 rounded-full border border-primary bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            // "bg-[var(--active)] border-[var(--text)]/50 ring-offset-[var(--bg)] focus-visible:ring-[var(--active)]" // These are now handled by sliderRootStyles
            // Shadcn v0.8.0 uses h-5 w-5 and ring-2, adjust if your version differs
            // "h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }