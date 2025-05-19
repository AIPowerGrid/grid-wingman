import { useState, useEffect } from 'react';
import * as React from 'react';
import { FiSettings, FiX, FiTrash2 } from 'react-icons/fi';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useConfig } from './ConfigContext';
import { useUpdateModels } from './hooks/useUpdateModels';
import { themes as appThemes, type Theme as AppTheme } from './Themes';
import { cn } from "@/src/background/util";

import { toast } from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetOverlay,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import { Model, ChatMode, ChatStatus } from "@/src/types/config"; // Updated import

function getStatusText(mode: ChatMode, status: ChatStatus): string {
  if (status === 'idle') return 'Online';

  if (mode === 'chat') {
    if (status === 'typing') return 'Typing…';
    if (status === 'thinking') return 'Thinking…';
  }

  if (mode === 'web') {
    if (status === 'searching') return 'Searching web…';
    if (status === 'thinking') return 'Processing SERP…';
  }

  if (mode === 'page') {
    if (status === 'reading') return 'Reading page…';
    if (status === 'thinking') return 'Analyzing…';
  }
  if (status === 'done') return 'Online';

  return 'Online';
}

interface Config {
  theme?: string;
  persona?: string;
  personas?: Record<string, any>;
  selectedModel?: string;
  models?: Model[];
  customTheme?: any;
  fontSize?: number;
  generateTitle?: boolean;
  backgroundImage?: boolean;
}
interface WelcomeModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  setSettingsMode: (mode: boolean) => void;
}
const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, setSettingsMode }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogOverlay className="bg-black/60" />
    <DialogContent
      className={cn(
          "bg-[var(--bg)] text-[var(--text)] border-[var(--text)]",
          "rounded-lg shadow-lg p-0 max-w-[240px] max-h-[140px]",
          "[&>button]:hidden"
      )}
      onInteractOutside={(e) => e.preventDefault()}
    >
      <DialogHeader className="text-center font-['Bruno_Ace_SC'] p-2">
        <DialogTitle className="text-base pt-2">Welcome</DialogTitle>
      </DialogHeader>
      <DialogDescription asChild>
        <div className="p-4 text-center">
          <p className="text-[var(--text)] text-xl font-['Bruno_Ace_SC'] mb-2 -mt-7">
            The game is afoot!<br />
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              className={cn(
                  "bg-[var(--active)] text-[var(--text)] border-[var(--text)]",
                  "rounded-xl shadow-sm px-1 py-1 h-auto",
                  "text-sm",
                  "hover:brightness-95 hover:shadow-md active:brightness-90"
              )}
              onClick={() => {
                  setSettingsMode(true);
              }}
            >
              <FiSettings className="size-3" /> Connect
            </Button>
          </div>
        </div>
      </DialogDescription>
    </DialogContent>
  </Dialog>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <div
    className={cn(
      "inline-block whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-xs",
      "bg-transparent text-[var(--text)]",
      "rounded-md py-0.5",
      "font-['poppins',_sans-serif] text-md text-center font-medium",
    )}
  >
    {children}
  </div>
);

const personaImages: {
  Agatha: string;
  Spike: string;
  Warren: string;
  Jet: string;
  Jan: string;
  Sherlock: string;
  Ein: string;
  Faye: string;
  default: string;
  [key: string]: string | undefined;
} = {  Agatha: 'assets/images/agatha.png',
  Spike: 'assets/images/spike.png',
  Warren: 'assets/images/warren.png',
  Jet: 'assets/images/jet.png',
  Jan: 'assets/images/jan.png',
  Sherlock: 'assets/images/Cognito.png',
  Ein: 'assets/images/ein.png',
  Faye:'assets/images/faye.png',
  default: 'assets/images/custom.png'
};

const SheetThemeButton = ({ theme, updateConfig, size = "h-7 w-7" }: { theme: AppTheme; updateConfig: (newConfig: Partial<Config>) => void; size?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        className={cn(
          size,
          "rounded-full p-0",
          "focus-visible:ring-1 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]",
          "hover:opacity-80 transition-opacity"
        )}
        style={{
          backgroundColor: theme.bg,
          borderColor: theme.text,
          borderWidth: '2px',
          boxShadow: `0 0 0 1px ${theme.active}`
        }}
        onClick={() => {
          updateConfig({ theme: theme.name });
        }}
        aria-label={`Set ${theme.name} theme`}
      />
    </TooltipTrigger>
    <TooltipContent side="top" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
      <p className="capitalize">{theme.name}</p>
    </TooltipContent>
  </Tooltip>
);

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
  setSettingsMode: (mode: boolean) => void;
  downloadText: () => void;
  downloadJson: () => void;
  downloadImage: () => void;
  setHistoryMode: (mode: boolean) => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onOpenChange,
  config,
  updateConfig,
  setSettingsMode,
  setHistoryMode,
  downloadText,
  downloadJson,
  downloadImage,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [inputFocused, setInputFocused] = React.useState(false);
  const { fetchAllModels } = useUpdateModels();
  const sheetContentRef = React.useRef<HTMLDivElement>(null);

  const currentPersona = config?.persona || 'default';
  const personaImageSrc = personaImages[currentPersona] || personaImages.default;

  const filteredModels =
    config?.models?.filter(
      (model) =>
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.host?.toLowerCase()?.includes(searchQuery.toLowerCase())
    ) || [];

  const toggleTheme = () => {
    const currentThemeName = config?.theme || 'paper';
    const nextThemeName = currentThemeName === 'dark' ? 'paper' : 'dark';
    const nextTheme = appThemes.find((t) => t.name === nextThemeName);
    if (nextTheme) {
      updateConfig({ theme: nextThemeName });
    }
  };

  const isDark = config?.theme === 'dark';
  const subtleBorderClass = 'border-[var(--text)]/10';
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,250,240,0.4)]';
  const inputHeight = 'h-9';
  const sectionPaddingX = 'px-6';
  const controlFilter = 'brightness-102 contrast-98';
  const buttonHeight = 'h-9';
  const controlSize = 'default';

  const handleConfigClick = () => {
    setSettingsMode(true);
    onOpenChange(false);
  };

  const handleHistoryClick = () => {
    setHistoryMode(true);
    onOpenChange(false);
  };

  const handleExportClick = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  const presetThemesForSheet = appThemes.filter(t => t.name !== 'custom' && t.name !== config?.customTheme?.name);


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetOverlay className="bg-black/50" />
        <SheetContent
           side="left"
           className={cn(
             "w-[320px] sm:w-[380px]",
             "bg-[var(--bg)] text-[var(--text)]",
             "p-0 border-r-0 shadow-xl flex flex-col h-full max-h-screen",
             "[&>button]:hidden",
             "settings-drawer-content",
             "overflow-y-auto"
            )}
            style={{ height: '100dvh' }}
            ref={sheetContentRef}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              sheetContentRef.current?.focus({ preventScroll: true });
            }}
        >
          <SheetHeader className="px-4 pt-3 pb-3">
             <div className="flex items-center justify-between mb-2 relative z-10">
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="sm"
                     aria-label={isDark ? 'Light' : 'Dark'}
                     onClick={toggleTheme}
                     className="text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md "
                   >
                     {isDark ? <IoSunnyOutline size="20px" /> : <IoMoonOutline size="20px" />}
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                   {isDark ? 'Light' : 'Dark'}
                 </TooltipContent>
               </Tooltip>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost" size="sm" aria-label="Close Settings"
                     className="text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md relative top-[1px]"
                     onClick={() => onOpenChange(false)}
                   >
                     <FiX size="20px" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                   Close Settings
                 </TooltipContent>
               </Tooltip>
             </div>
             <SheetTitle className="text-center font-['Orbitron',_sans-serif] tracking-tight -mt-10">
               <a href="https://github.com/3-ark/Cognito" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-[var(--text)] bg-[var(--active)] inline-block px-3 py-1 rounded-md no-underline">
                 COGNITO <sub className="italic contrast-200 text-[0.5em]">v3.4</sub>
               </a>
             </SheetTitle>
             <SheetDescription className="text-center text-xl font-bold text-[var(--text)] leading-tight mt-0">
               Settings
             </SheetDescription>
          </SheetHeader>
           <div className={cn("flex flex-col h-full overflow-y-auto settings-drawer-body", "no-scrollbar")}>
              <div className={cn("flex flex-col space-y-5 flex-1", sectionPaddingX, "py-4",)}>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="persona-select" className="text-[var(--text)] opacity-80 text-lg font-medium uppercase shrink-0">
                        Persona
                      </label>
                      <Avatar className="h-8 w-8 border border-[var(--text)]/10">
                        <AvatarImage src={personaImageSrc} alt={currentPersona} />
                        <AvatarFallback>{currentPersona.substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {presetThemesForSheet.map(theme => (
                        <SheetThemeButton
                          key={theme.name}
                          theme={theme}
                          updateConfig={updateConfig}
                        />
                      ))}
                    </div>
                  </div>
                    <div className="w-full">
                    <Select
                      value={currentPersona}
                      onValueChange={(value) => updateConfig({ persona: value })}
                    >
                      <SelectTrigger
                        id="persona-select"
                        className={cn(
                          controlBg,
                          subtleBorderClass,
                          inputHeight,
                          "text-[var(--text)] rounded-xl shadow-md w-full",
                          "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
                          "hover:border-[var(--active)] hover:brightness-98",
                          "data-[placeholder]:text-muted-foreground"
                        )}
                        style={{ filter: controlFilter }}
                      >
                        <SelectValue placeholder="Select Persona..." />
                      </SelectTrigger>
                      <SelectContent
                          className={cn(
                            "bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]/10",
                            "rounded-md shadow-lg" // Added for consistency
                          )}
                      >
                        {Object.keys(config?.personas || {}).map((p) => (
                          <SelectItem key={p} value={p} className="hover:brightness-95 focus:bg-[var(--active)]">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="model-input" className="block text-[var(--text)] opacity-80 text-lg font-medium uppercase">
                    Model
                  </label>
                  <div className="relative">
                    <Input
                       id="model-input"
                       value={inputFocused ? searchQuery : config?.selectedModel || ''}
                       placeholder={
                         inputFocused
                           ? 'Search models...'
                           : config?.selectedModel || 'Select model...'
                       }
                       onChange={(e) => setSearchQuery(e.target.value)}
                       onFocus={() => {
                         setSearchQuery('');
                         setInputFocused(true);
                         fetchAllModels();
                       }}
                       onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                       className={cn(
                         controlBg, subtleBorderClass, inputHeight,
                         "text-[var(--text)] rounded-xl shadow-md",
                         "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
                         "hover:border-[var(--active)] hover:brightness-98",
                         "placeholder:text-muted-foreground"
                       )}
                       style={{ filter: controlFilter }}
                    />
                    {inputFocused && (
                       <ScrollArea
                         className={cn(
                            "absolute w-full mt-1 max-h-[200px] overflow-y-auto",
                            "bg-[var(--bg)] border-[var(--text)] rounded-md shadow-md z-10",
                            "no-scrollbar"
                         )}
                       >
                          <div className="p-1">
                          {filteredModels.length > 0 ? (
                            filteredModels.map((model) => (
                              <div
                                key={model.id}
                                className={cn(
                                    "p-3 cursor-pointer text-[var(--text)] text-sm rounded",
                                    "hover:bg-[var(--active)]"
                                )}
                                onMouseDown={() => {
                                  updateConfig({ selectedModel: model.id });
                                  setSearchQuery('');
                                  setInputFocused(false);
                                }}
                              >
                                {model.host ? `(${model.host}) ${model.id}` : model.id}
                                {model.context_length ? (
                                  <span
                                    className="text-xs text-[var(--text)] opacity-60 ml-2"
                                  >
                                    [ctx: {model.context_length}]
                                  </span>
                                ) : (
                                  ''
                                )}
                              </div>
                            ))
                          ) : (
                             <div className="p-2 text-[var(--text)] opacity-60 text-sm">
                              No models found
                            </div>
                          )}
                          </div>
                       </ScrollArea>
                    )}
                  </div>
                </div>

                 <div className="space-y-3">
                    <Button
                      variant="outline" size={controlSize} onClick={handleConfigClick}
                      className={cn(
                        controlBg, subtleBorderClass, buttonHeight,
                        "text-[var(--text)] rounded-xl shadow-md w-full justify-start font-medium",
                        "hover:border-[var(--active)] hover:brightness-98 active:bg-[var(--active)] active:brightness-95",
                        "focus:ring-1 focus:ring-[var(--active)]"
                      )}
                      style={{ filter: controlFilter }}
                    >
                      Configuration
                    </Button>
                    <Button
                       variant="outline" size={controlSize} onClick={handleHistoryClick}
                       className={cn(
                         controlBg, subtleBorderClass, buttonHeight,
                         "text-[var(--text)] rounded-xl shadow-md w-full justify-start font-medium",
                         "hover:border-[var(--active)] hover:brightness-98 active:bg-[var(--active)] active:brightness-95",
                         "focus:ring-1 focus:ring-[var(--active)]"
                       )}
                       style={{ filter: controlFilter }}
                    >
                      Chat History
                    </Button>
                 </div>

                 <div className="space-y-3">
                   <p className="text-[var(--text)] opacity-80 text-lg font-medium mb-2 uppercase">
                     Export Now
                   </p>
                   {[
                     { label: "Text", action: downloadText },
                     { label: "JSON", action: downloadJson },
                     { label: "Image", action: downloadImage },
                   ].map(item => (
                     <Button
                       key={item.label} variant="outline" size={controlSize}
                       onClick={() => handleExportClick(item.action)}
                       className={cn(
                         controlBg, subtleBorderClass, buttonHeight,
                         "text-[var(--text)] rounded-xl shadow-md w-full justify-start font-medium",
                         "hover:border-[var(--active)] hover:brightness-98 active:bg-[var(--active)] active:brightness-95",
                         "focus:ring-1 focus:ring-[var(--active)]"
                       )}
                       style={{ filter: controlFilter }}
                     >
                       {item.label}
                     </Button>
                   ))}
                 </div>
              </div>
              <div className={cn("mt-auto text-center text-[var(--text)] opacity-70 text-xs font-normal pb-4", sectionPaddingX)}>
                  Made with ❤️ by @3-Arc
              </div>
           </div>
        </SheetContent>
    </Sheet>
  );
};


interface HeaderProps {
  chatTitle?: string | null;
  settingsMode: boolean;
  setSettingsMode: (mode: boolean) => void;
  historyMode: boolean;
  setHistoryMode: (mode: boolean) => void;
  deleteAll: () => void | Promise<void>; 
  reset: () => void;
  downloadImage: () => void;
  downloadJson: () => void;
  downloadText: () => void;
  chatMode: ChatMode;
  chatStatus: ChatStatus;

}
export const Header: React.FC<HeaderProps> = ({
  chatTitle,
  settingsMode,
  setSettingsMode,
  historyMode,
  setHistoryMode,
  deleteAll,
  reset,
  downloadImage,
  downloadJson,
  downloadText,
  chatMode,
  chatStatus,
}) => {
  const { config, updateConfig } = useConfig();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const currentPersona = config?.persona || 'default';
  const personaImageSrc = personaImages[currentPersona] || personaImages.default;

  const visibleTitle = chatTitle && !settingsMode && !historyMode;

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
  };

  const showBackButton = settingsMode || historyMode;
  
  const handleLeftButtonClick = () => {
    if (showBackButton) {
      setSettingsMode(false);
      setHistoryMode(false);
    } else {
      setIsSheetOpen(true);
    }
  };

  const leftButtonLabel = showBackButton ? 'Back to Chat' : 'Open Settings';

  const handleDeleteAllWithConfirmation = () => {
    toast.custom(
      (t) => (
        <div
          className={cn(
            "bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]",
            "p-4 rounded-lg shadow-xl max-w-sm w-full",
            "flex flex-col space-y-3"
          )}
        >
          <h4 className="text-lg font-semibold text-[var(--text)]">Confirm Deletion</h4>
          <p className="text-sm text-[var(--text)] opacity-90">
            Are you sure you want to delete all chat history? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "bg-transparent text-[var(--text)] border-[var(--text)]",
                "hover:bg-[var(--active)]/30 focus:ring-1 focus:ring-[var(--active)]"
              )}
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </Button>
            <Button
              variant="default" 
              size="sm"
              className={cn(
                "bg-red-600 text-white hover:bg-red-700", 
                "focus:ring-1 focus:ring-red-400 focus:ring-offset-1 focus:ring-offset-[var(--bg)]"
              )}
              onClick={async () => {
                try {
                  if (typeof deleteAll === 'function') {
                    await deleteAll(); 
                  } else {
                    console.error("Header: deleteAll prop is not a function or undefined.", deleteAll);
                    toast.error("Failed to delete history: Operation not available.");
                  }
                } catch (error) {
                  console.error("Error during deleteAll execution from header:", error);
                  toast.error("An error occurred while deleting history.");
                } finally {
                  toast.dismiss(t.id);
                }
              }}
            >
              Delete All
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
      }
    );
  };

  const sideContainerWidthClass = "w-24";

  return (
    <TooltipProvider delayDuration={500}>
      <div
        className={cn(
          "border-b border-[var(--text)]/20", // Changed: Removed background, subtler border
          "sticky top-0 z-10 p-0"
        )}
      >
        <div className="flex items-center h-auto py-0.5 px-3"> {/* Overall padding for header content */}
          {/* Left Button Area */}
          <div className={cn("flex justify-start items-center min-h-10", sideContainerWidthClass)}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={leftButtonLabel}
                  variant="ghost"
                  size={showBackButton ? "sm" : undefined}
                  className={cn(
                    "text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md",
                    !showBackButton && "px-2 py-[3px] h-auto" // Custom padding for Avatar version
                  )}
                  onClick={handleLeftButtonClick}
                >
                  {showBackButton ? (
                    <FiX size="22px" />
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <Avatar className="h-8 w-8 border border-[var(--text)]/30">
                        <AvatarImage src={personaImageSrc} alt={currentPersona} />
                        <AvatarFallback>{(currentPersona === 'default' ? 'C' : currentPersona.substring(0, 1)).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start -space-y-0.5">
                        <span className="text-[13px] font-medium text-[var(--text)] leading-tight">
                          {currentPersona === 'default' ? 'Cognito' : currentPersona}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight flex items-center pt-0.5">
                          {chatStatus === 'idle' && (
                            <span className="h-1.5 w-1.5 bg-green-600 rounded-full mr-1"></span>
                          )}
                          {getStatusText(chatMode, chatStatus)}
                        </span>
                      </div>
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                {leftButtonLabel}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Middle Content Area */}
          <div className="flex-grow flex justify-center items-center overflow-hidden px-2">
            {visibleTitle && (
              <p className="text-lg font-semibold text-[var(--text)] italic whitespace-nowrap overflow-hidden text-ellipsis text-center">
                {chatTitle}
              </p>
            )}
            {!visibleTitle && !historyMode && !settingsMode && (
              <Badge>
                {config?.selectedModel || 'No Model Selected'} {/* Changed: Show only model name */}
              </Badge>
            )}
            {settingsMode && (
              <div className="flex items-center justify-center">
                 <p className="relative top-0 text-lg font-['Bruno_Ace_SC'] text-[var(--text)] text-center">
                   Configuration
                 </p>
              </div>
            )}
            {historyMode && (
              <div className="flex items-center justify-center">
                <p className="font-['Bruno_Ace_SC'] text-lg text-[var(--text)] whitespace-nowrap">
                  Chat History
                </p>
              </div>
            )}
          </div>

          {/* Right Button Area */}
          <div className={cn("flex justify-end items-center min-h-10", sideContainerWidthClass)}>
            {!settingsMode && !historyMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Reset Chat"
                    variant="ghost"
                    size="sm" // Consistent size for icon button
                    className="text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md"
                    onClick={reset}
                  >
                    <FiTrash2 size="18px" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                  Reset Chat
                </TooltipContent>
              </Tooltip>
            )}
            {historyMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Delete All History"
                    variant="ghost"
                    size="sm" // Consistent size for icon button
                    className="text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md"
                    onClick={handleDeleteAllWithConfirmation}
                  >
                    <FiTrash2 size="18px" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                  Delete All
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {(!config?.models || config.models.length === 0) && !settingsMode && !historyMode && (
           <WelcomeModal isOpen={true} setSettingsMode={setSettingsMode} onClose={() => {}} />
        )}

        <SettingsSheet
          isOpen={isSheetOpen}
          onOpenChange={handleSheetOpenChange}
          config={config}
          updateConfig={updateConfig}
          setSettingsMode={setSettingsMode}
          setHistoryMode={setHistoryMode}
          downloadText={downloadText}
          downloadJson={downloadJson}
          downloadImage={downloadImage}
        />
      </div>
    </TooltipProvider>
  );
};