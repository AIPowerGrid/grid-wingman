import { useState, useEffect, useRef } from 'react';
import * as React from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { PiShareFatLight } from "react-icons/pi";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { IoChevronBack } from "react-icons/io5";
import { RxAvatar } from "react-icons/rx";
import { CiText, CiImageOn } from "react-icons/ci";
import { TbJson } from "react-icons/tb";
import { IoFingerPrint } from "react-icons/io5";

import {type Config, Model, ChatMode, ChatStatus } from "@/src/types/config";
import { personaImages } from './constants';

const sharedTooltipContentStyle = "bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]";

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

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  setSettingsMode: (mode: boolean) => void;
}
const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, setSettingsMode}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent
      variant="themedPanel"
      className={cn( 
          "max-w-[240px] max-h-[140px]",
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
                  variant="ghost"
                  className="fingerprint-pulse-btn"
                  onClick={() => setSettingsMode(true)}
                  aria-label="Connect to your models"
                >
                  <IoFingerPrint size="48" color="var(--active)" />
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
  setHistoryMode: (mode: boolean) => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onOpenChange,
  config,
  updateConfig,
  setSettingsMode,
  setHistoryMode,
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
  const sectionPaddingX = 'px-6';

  const handleConfigClick = () => {
    setSettingsMode(true);
    onOpenChange(false);
  };

  const handleHistoryClick = () => {
    setHistoryMode(true);
    onOpenChange(false);
  };

  const presetThemesForSheet = appThemes.filter(t => t.name !== 'custom' && t.name !== config?.customTheme?.name);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetOverlay />
        <SheetContent
           variant="themedPanel"
           side="left"
           className={cn(
             "w-[320px] sm:w-[380px]",
             "p-0 border-r-0",
             "flex flex-col h-full max-h-screen",
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
                   <Button variant="ghost" size="sm" aria-label={isDark ? 'Light' : 'Dark'} onClick={toggleTheme} className="text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md ">
                     {isDark ? <IoSunnyOutline size="20px" /> : <IoMoonOutline size="20px" />}
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" className={sharedTooltipContentStyle}>
                   {isDark ? 'Light' : 'Dark'}
                 </TooltipContent>
               </Tooltip>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button variant="ghost" size="sm" aria-label="Close Settings" className="text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md relative top-[1px]" onClick={() => onOpenChange(false)}>
                     <FiX size="20px" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" className={sharedTooltipContentStyle}> Close Settings </TooltipContent>
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
                      <Avatar className="h-8 w-8 border border-[var(--active)]">
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
                        variant="settingsPanel"
                        className="w-full data-[placeholder]:text-muted-foreground"
                      >
                        <SelectValue placeholder="Select Persona..." />
                      </SelectTrigger>
                      <SelectContent
                        variant="settingsPanel"
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
                  <label htmlFor="model-input" className="block text-[var(--text)] opacity-80 text-lg font-medium uppercase">Model</label>
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
                         "text-[var(--text)] rounded-xl shadow-md h-9",
                         "bg-[rgba(255,250,240,0.4)] dark:bg-[rgba(255,255,255,0.1)]",
                         "border-[var(--text)]/10",
                         "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
                         "hover:border-[var(--active)] hover:brightness-98",
                         "placeholder:text-muted-foreground"
                       )}
                    />
                    {inputFocused && (
                       <ScrollArea
                         className={cn(
                            "w-full mt-1 max-h-[200px] overflow-y-auto",
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
                      size="default" onClick={handleConfigClick}
                      className={cn(
                        "text-[var(--text)] rounded-xl shadow-md w-full justify-start font-medium h-9",
                        "bg-[rgba(255,250,240,0.4)] dark:bg-[rgba(255,255,255,0.1)]",
                        "border-[var(--text)]/10",
                        "hover:border-[var(--active)] hover:brightness-98 active:bg-[var(--active)] active:brightness-95",
                        "focus:ring-1 focus:ring-[var(--active)]"
                      )}
                    >
                      Configuration
                    </Button>
                    <Button
                       size="default" onClick={handleHistoryClick}
                       className={cn(
                        "text-[var(--text)] rounded-xl shadow-md w-full justify-start font-medium h-9",
                        "bg-[rgba(255,250,240,0.4)] dark:bg-[rgba(255,255,255,0.1)]",
                        "border-[var(--text)]/10",
                        "hover:border-[var(--active)] hover:brightness-98 active:bg-[var(--active)] active:brightness-95",
                        "focus:ring-1 focus:ring-[var(--active)]"
                       )}
                    >
                      Chat History
                    </Button>
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

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  isOpen,
  onOpenChange,
  config,
  updateConfig,
}) => {
  const [currentUserName, setCurrentUserName] = useState(config?.userName || '');
  const [currentUserProfile, setCurrentUserProfile] = useState(config?.userProfile || '');

  useEffect(() => {
    if (isOpen) {
      setCurrentUserName(config?.userName || '');
      setCurrentUserProfile(config?.userProfile || '');
    }
  }, [isOpen, config?.userName, config?.userProfile]);

  const handleSave = () => {
    updateConfig({ userName: currentUserName, userProfile: currentUserProfile });
    onOpenChange(false);
    toast.success("Profile updated!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        variant="themedPanel"
        className="max-w-xs"
      >
        <DialogHeader className="px-6 py-4 border-b border-[var(--text)]/10">
          <DialogTitle className="text-lg font-semibold text-[var(--text)]">Edit Profile</DialogTitle>
          <DialogDescription className="text-sm text-[var(--text)] opacity-80">
            Set your display name and profile information. (For chat and export purposes)
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm font-medium text-[var(--text)] opacity-90">
              Username
            </Label>
            <Input
              id="username"
              value={currentUserName}
              onChange={(e) => setCurrentUserName(e.target.value)}
              className={cn(
                "text-[var(--text)] rounded-md shadow-sm w-full h-10",
                "bg-[rgba(255,250,240,0.4)] dark:bg-[rgba(255,255,255,0.1)]",
                "border-[var(--text)]/10",
                "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
                "hover:border-[var(--active)] hover:brightness-98",
                "placeholder:text-muted-foreground"
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="userprofile" className="text-sm font-medium text-[var(--text)] opacity-90">
              User Profile
            </Label>
            <Input
              id="userprofile"
              value={currentUserProfile}
              onChange={(e) => setCurrentUserProfile(e.target.value)}              
              className={cn(
                "text-[var(--text)] rounded-md shadow-sm w-full h-10",
                "bg-[rgba(255,250,240,0.4)] dark:bg-[rgba(255,255,255,0.1)]",
                "border-[var(--text)]/10",
                "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
                "hover:border-[var(--active)] hover:brightness-98",
                "placeholder:text-muted-foreground"
              )}
            />
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-[var(--text)]/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-[var(--text)] border-[var(--text)]/50 hover:bg-[var(--text)]/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[var(--active)] text-[var(--bg)] hover:brightness-110"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
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
  const rightSideContainerWidthClass = sideContainerWidthClass;
  const dropdownContentClasses = "z-50 min-w-[6rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
  const dropdownItemClasses = "flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors focus:bg-accent focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
  const dropdownSubTriggerClasses = "flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent";
  const dropdownSeparatorClasses = "-mx-1 my-1 h-px bg-muted";

  return (
    <TooltipProvider delayDuration={500}>
      <div
        className={cn(
          config?.theme === 'dark' ? 'border border-[var(--active)]' : 'border border-[var(--text)]/20',
          "sticky top-0 z-10 p-0"
        )}
      >
        <div className="flex items-center h-auto py-0.5 px-2">
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
                    !showBackButton && "px-2 py-[3px] h-auto"
                  )}
                  onClick={handleLeftButtonClick}
                >
                  {showBackButton ? (
                    <FiX size="22px" />
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <Avatar className="h-8 w-8 border border-[var(--active)]">
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
          <div className="flex-grow flex justify-center items-center overflow-hidden px-1">
            {visibleTitle && (
              <p className="text-sm font-semibold text-[var(--text)] whitespace-nowrap overflow-hidden text-ellipsis text-center">
                {chatTitle}
              </p>
            )}
            {!visibleTitle && !historyMode && !settingsMode && (
              <Badge>
                {config?.selectedModel || 'No Model Selected'}
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
                <p className="font-['Bruno_Ace_SC'] text-lg text-[var(--text)] whitespace-nowrap text-center">
                  Chat History
                </p>
              </div>
            )}
          </div>

          {/* Right Button Area */}
          <div className={cn("flex justify-end items-center min-h-10", rightSideContainerWidthClass)}>
            {!settingsMode && !historyMode && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Reset Chat"
                      variant="ghost"
                      size="sm"
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

                {/* Share Button with Radix Dropdown Menu */}
                <DropdownMenuPrimitive.Root>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuPrimitive.Trigger asChild>
                        <Button
                          aria-label="Share Options"
                          variant="ghost"
                          size="sm"
                          className="-ml-2 text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-md" // -ml-2 here is on the button, which is fine for inter-button spacing
                        >
                          <PiShareFatLight size="18px" />
                        </Button>
                      </DropdownMenuPrimitive.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                      Share Options
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuPrimitive.Portal>
                    <DropdownMenuPrimitive.Content
                      className={cn(
                        dropdownContentClasses,
                        "bg-[var(--bg)] text-[var(--text)] border-[var(--text)]/20 shadow-xl"
                      )}
                      sideOffset={5}
                      align="end"
                    >
                      <DropdownMenuPrimitive.Item
                        className={cn(
                          dropdownItemClasses,
                          "hover:bg-[var(--active)]/30 focus:bg-[var(--active)]/30 cursor-pointer"
                        )}
                        onSelect={() => setIsEditProfileDialogOpen(true)}
                      >
                        <RxAvatar className="mr-auto h-4 w-4" />
                        Edit Profile
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Separator
                        className={cn(
                          dropdownSeparatorClasses,
                          "bg-[var(--text)]/10"
                        )}
                      />
                      <DropdownMenuPrimitive.Sub>
                        <DropdownMenuPrimitive.SubTrigger
                          className={cn(
                            dropdownSubTriggerClasses,
                            "hover:bg-[var(--active)]/30 focus:bg-[var(--active)]/30 cursor-pointer"
                          )}
                        >
                        <IoChevronBack className="mr-auto h-4 w-4" />
                          Export Chat
                        </DropdownMenuPrimitive.SubTrigger>
                        <DropdownMenuPrimitive.Portal>
                          <DropdownMenuPrimitive.SubContent
                            className={cn(
                              dropdownContentClasses,
                              "bg-[var(--bg)] text-[var(--text)] border-[var(--text)]/20 shadow-lg"
                            )}
                            sideOffset={2}
                            alignOffset={-5}
                          >
                            <DropdownMenuPrimitive.Item
                              className={cn(dropdownItemClasses, "hover:bg-[var(--active)]/30 focus:bg-[var(--active)]/30 cursor-pointer")}
                              onSelect={downloadText}
                            >
                            <CiText className="mr-auto h-4 w-4" />
                              .txt
                            </DropdownMenuPrimitive.Item>
                            <DropdownMenuPrimitive.Item
                              className={cn(dropdownItemClasses, "hover:bg-[var(--active)]/30 focus:bg-[var(--active)]/30 cursor-pointer")}
                              onSelect={downloadJson}
                            >
                            <TbJson className="mr-auto h-4 w-4" />
                              .json
                            </DropdownMenuPrimitive.Item>
                            <DropdownMenuPrimitive.Item
                              className={cn(dropdownItemClasses, "hover:bg-[var(--active)]/30 focus:bg-[var(--active)]/30 cursor-pointer")}
                              onSelect={downloadImage}
                            >
                            <CiImageOn className="mr-auto h-4 w-4" />
                              .png
                            </DropdownMenuPrimitive.Item>
                          </DropdownMenuPrimitive.SubContent>
                        </DropdownMenuPrimitive.Portal>
                      </DropdownMenuPrimitive.Sub>
                    </DropdownMenuPrimitive.Content>
                  </DropdownMenuPrimitive.Portal>
                </DropdownMenuPrimitive.Root>
              </>
            )}
            {historyMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Delete All History"
                    variant="ghost"
                    size="sm"
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
        />

        <EditProfileDialog
          isOpen={isEditProfileDialogOpen}
          onOpenChange={setIsEditProfileDialogOpen}
          config={config}
          updateConfig={updateConfig}
        />
      </div>
    </TooltipProvider>
  );
};