import { GoArrowSwitch } from "react-icons/go";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator // Import Separator
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/src/background/util"; // For conditional classes

// Assuming useConfig hook exists and works as before
import { useConfig } from './ConfigContext';

export const AddToChat = () => {
  const { config, updateConfig } = useConfig();

  const currentMode = config?.chatMode; // Store current mode for easier comparison

  return (
    // TooltipProvider is needed for Tooltip
    (<TooltipProvider delayDuration={500}>
      {/* DropdownMenu wraps the trigger and content */}
      <DropdownMenu>
        {/* Tooltip wraps the DropdownMenuTrigger */}
        <Tooltip>
          {/* TooltipTrigger wraps the actual button */}
          <TooltipTrigger asChild>
            {/* DropdownMenuTrigger wraps the button that opens the menu */}
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="sm" // Original size was sm
                aria-label="Switch Chat Mode"
                className={cn(
                  "ml-2 rounded-md text-foreground hover:bg-muted/50 font-extrabold", // Mimic original styles: ml, rounded, color, hover, font weight
                  // Adjust width/padding if text makes it too wide/narrow
                  currentMode ? "px-2" : "px-1" // Less padding if only icon
                )}
                // zIndex={2} // z-20 - Usually not needed with portals, remove unless specific stacking issue arises
              >
                {/* Center content using flexbox */}
                <div className="flex items-center justify-center h-full">
                  {!currentMode ? (
                    // Use react-icon directly
                    (<GoArrowSwitch className="h-5 w-5 text-foreground" />) // text-xl is ~1.25rem, h-5 w-5 is 1.25rem
                  ) : (
                    // Display uppercase mode text
                    (<span className="text-sm">{currentMode.toUpperCase()}</span>) // Ensure text size matches button size context
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {/* TooltipContent holds the tooltip text */}
          <TooltipContent
            side="top" // Original placement="top"
            className="bg-background text-foreground border border-border" // Mimic original style
          >
            <p>Switch Chat Mode</p>
          </TooltipContent>
        </Tooltip>

        {/* DropdownMenuContent holds the menu items */}
        <DropdownMenuContent
          align="end" // Aligns the end of the menu with the end of the trigger (replaces mr)
          sideOffset={5} // Small offset from the trigger (replaces marginTop)
          className="bg-primary text-primary-foreground border border-border rounded-md min-w-[80px] p-1 z-50" // Mimic original: bg, color, border, rounded, padding. Added z-index just in case. Adjust min-w as needed.
        >
          {/* CHAT Item */}
          <DropdownMenuItem
            onClick={() => updateConfig({ chatMode: undefined })}
            className={cn(
              "flex justify-center font-extrabold text-md py-1 cursor-pointer focus:bg-background focus:text-foreground", // Mimic original: flex, justify, font, size, padding
              !currentMode ? "bg-background text-foreground" : "bg-transparent text-primary-foreground" // Conditional background for active state
            )}
          >
            CHAT
          </DropdownMenuItem>

          {/* Separator instead of border */}
          <DropdownMenuSeparator className="bg-border h-[1px] my-1" />

          {/* PAGE Item */}
          <DropdownMenuItem
            onClick={() => updateConfig({ chatMode: 'page' })}
            className={cn(
              "flex justify-center font-extrabold text-md py-1 cursor-pointer focus:bg-background focus:text-foreground", // Mimic original styles
              currentMode === 'page' ? "bg-background text-foreground" : "bg-transparent text-primary-foreground" // Conditional background
            )}
          >
            PAGE
          </DropdownMenuItem>

          {/* Separator instead of border */}
          <DropdownMenuSeparator className="bg-border h-[1px] my-1" />

          {/* WEB Item */}
          <DropdownMenuItem
            onClick={() => updateConfig({ chatMode: 'web' })}
            className={cn(
              "flex justify-center font-extrabold text-md py-1 cursor-pointer focus:bg-background focus:text-foreground", // Mimic original styles
              currentMode === 'web' ? "bg-background text-foreground" : "bg-transparent text-primary-foreground" // Conditional background
            )}
          >
            WEB
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>)
  );
};