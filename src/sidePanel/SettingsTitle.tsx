import type { ReactNode } from 'react';
import { cn } from "@/src/background/util"; // Assuming this path is correct

interface SettingTitleProps {
  text?: string;
  widget?: ReactNode;
  icon?: string; // Assuming icon is a string (like an emoji or character) based on original usage
}

export const SettingTitle = ({
 text = '', widget = <></>, icon = ''
}: SettingTitleProps) => (
  // Outer div replacing Box, applying flex layout
  (<div className="flex items-center justify-between w-full">
    {/* Left side: Icon + Text */}
    <div className="flex items-center">
      {icon && (
        // Span replacing Text for icon
        (<span
          className={cn(
            "text-foreground", // color="var(--text)"
            "text-xl",        // fontSize="1.25rem"
            "leading-none",   // lineHeight="1"
            "mr-3"            // mr={3}
          )}
        >
          {icon}
        </span>)
      )}
      <span
        className={cn(
          "text-foreground", // color="var(--text)"
          "opacity-90",     // opacity={0.9}
          "text-base",      // fontSize="md" (Tailwind's base is 1rem, md is 1rem)
          "font-medium"     // fontWeight="medium"
        )}
      >
        {text}
      </span>
    </div>
    {/* Right side: Widget */}
    {widget && (
      <div className="ml-2"> {/* ml={2} */}
        {widget}
      </div>
    )}
  </div>)
);