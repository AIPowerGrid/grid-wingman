import { GoArrowSwitch } from "react-icons/go";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/src/background/util";

import { useConfig } from './ConfigContext';

export const AddToChat = () => {
  const { config, updateConfig } = useConfig();

  const currentMode = config?.chatMode;

  return (
    (<TooltipProvider delayDuration={500}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm" 
                aria-label="Switch Chat Mode"
                className={cn(
                  "rounded-md ml-2 text-foreground hover:bg-muted/50 font-extrabold", 
                  "px-2 not-focus-visible",
                )}
              >
                <div className="flex items-center justify-center h-full">
                  {!currentMode ? (
                    (<GoArrowSwitch className="h-5 w-5 text-foreground" />)
                  ) : (
                    (<span className="text-sm">{currentMode.toUpperCase()}</span>)
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-secondary/50 text-foreground"
          >
            <p>Switch Chat Mode</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="end" // Aligns the end of the menu with the end of the trigger (replaces mr)
          sideOffset={5} // Small offset from the trigger (replaces marginTop)
          className="bg-secondary text-primary-foreground rounded-md min-w-[80px] z-50" // Mimic original: bg, color, border, rounded, padding. Added z-index just in case. Adjust min-w as needed.
        >
          <DropdownMenuItem
            onClick={() => updateConfig({ chatMode: undefined })}
            className={cn(
              "p-0",
              "flex justify-center font-extrabold text-md cursor-pointer not-focus-visible", // Mimic original: flex, justify, font, size, padding
              !currentMode ? "bg-background text-foreground" : "bg-transparent text-primary-foreground" // Conditional background for active state
            )}
          >
            CHAT
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border h-[1px] my-1" />

          <DropdownMenuItem
            onClick={() => updateConfig({ chatMode: 'page' })}
            className={cn(
              "p-0",
              "flex justify-center font-extrabold text-md cursor-pointer not-focus-visible", // Mimic original styles
              currentMode === 'page' ? "bg-background text-foreground" : "bg-transparent text-primary-foreground" // Conditional background
            )}
          >
            PAGE
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border h-[1px] my-1" />

          <DropdownMenuItem
            onClick={() => updateConfig({ chatMode: 'web' })}
            className={cn(
              "p-0",
              "flex justify-center font-extrabold text-md cursor-pointer not-focus-visible", // Mimic original styles
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