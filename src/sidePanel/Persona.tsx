// src/sidePanel/Personas.tsx
import { ForwardedRef, TextareaHTMLAttributes, useEffect, useState, ChangeEvent, Dispatch, SetStateAction } from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogClose, // Not explicitly used as buttons handle close
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IoAdd, IoTrashOutline } from 'react-icons/io5';
import React from 'react';
import { useConfig } from './ConfigContext';
import { SettingTitle } from './SettingsTitle';
import { cn } from "@/src/background/util";

// Styling constants
const commonSubtleBorderClass = 'border-[var(--text)]/10';
const commonControlBg = (isDark: boolean) => isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,250,240,0.4)]';
const commonItemShadow = 'shadow-md';
const commonItemRounded = 'rounded-xl';
const commonInputHeight = 'h-9';

interface AutoResizeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  isDark: boolean;
  onTextAreaFocus?: () => void;
  isEffectivelyReadOnly?: boolean;
}

const AutoResizeTextarea = React.forwardRef(
  (
    {
      isDark,
      onTextAreaFocus,
      isEffectivelyReadOnly,
      className,
      ...rest
    }: AutoResizeTextareaProps,
    ref: ForwardedRef<HTMLTextAreaElement>
  ) => {
    const currentControlBg = commonControlBg(isDark ?? false);

    return (
      <ResizeTextarea
        ref={ref}
        minRows={3}
        maxRows={8}
        readOnly={isEffectivelyReadOnly}
        onFocus={(e) => {
          if (rest.onFocus) rest.onFocus(e);
          if (onTextAreaFocus) onTextAreaFocus();
        }}
        className={cn(
          "flex w-full min-h-[80px] px-3 py-2 text-sm ring-offset-[var(--bg)] placeholder:text-[var(--muted-foreground)]",
          currentControlBg,
          commonItemRounded,
          commonItemShadow,
          "text-[var(--text)]",
          commonSubtleBorderClass,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
          isEffectivelyReadOnly
            ? "opacity-75 cursor-default"
            : "hover:border-[var(--active)] focus:border-[var(--active)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...rest}
      />
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
// --- SaveButtons component ---
const SaveButtons = ({
  hasChange,
  onSave,
  onSaveAs,
  onCancel,
}: {
  hasChange: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  onCancel: () => void;
}) => {
  if (!hasChange) return null;

  return (
    <div className="flex mt-4 space-x-2 justify-end w-full">
      <Button
        variant="default"
        size="sm"
        className={cn(
          commonItemRounded,
          "bg-[var(--active)] text-[var(--text)] border border-[var(--text)] hover:brightness-110",
          "focus-visible:ring-1 focus-visible:ring-[var(--active)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
        )}
        onClick={onSave}
      >
        Save
      </Button>
      <Button
        variant="default"
        size="sm"
        className={cn(
          commonItemRounded,
          "bg-[var(--active)] text-[var(--text)] border border-[var(--text)] hover:brightness-110",
          "focus-visible:ring-1 focus-visible:ring-[var(--active)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
        )}
        onClick={onSaveAs}
      >
        Save As...
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          commonItemRounded,
          "text-[var(--text)] border-[var(--text)]/50",
          "hover:bg-[var(--text)]/10 hover:border-[var(--text)]/70",
          "focus-visible:ring-1 focus-visible:ring-[var(--active)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
        )}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
};

// --- PersonaModal component ---
const PersonaModal = ({
  isOpen, onOpenChange, personaPrompt, personas, updateConfig, onModalClose, isDark
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  personaPrompt: string;
  personas: Record<string, string>;
  updateConfig: (config: any) => void;
  onModalClose: () => void;
  isDark: boolean;
}) => {
  const [name, setName] = useState('');
  const controlBgClass = commonControlBg(isDark);

  const handleCreate = () => {
    if (!name.trim()) return;
    updateConfig({
      personas: { ...personas, [name.trim()]: personaPrompt },
      persona: name.trim()
    });
    setName('');
    onModalClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[425px]",
          "bg-[var(--bg)]", // Use main background for opacity
          "border", commonSubtleBorderClass,
          commonItemRounded,
          commonItemShadow,
          "text-[var(--text)]"
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--text)]">Create New Persona</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="persona-name" className="text-base font-medium text-foreground sr-only">
            Persona Name
          </Label>
          <Input
            id="persona-name"
            placeholder="Enter persona name"
            value={name}
            onChange={e => setName(e.target.value)}
            className={cn(
              controlBgClass, commonSubtleBorderClass, commonInputHeight,
              "text-[var(--text)]", commonItemRounded, commonItemShadow, "w-full px-3",
              "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
              "hover:border-[var(--active)] hover:brightness-98"
            )}
          />
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" size="sm"
            className={cn(commonItemRounded, "text-[var(--text)] border-[var(--text)]/50", "hover:bg-[var(--text)]/10 hover:border-[var(--text)]/70")}
            onClick={onModalClose}
          > Cancel </Button>
          <Button type="button" variant="default" size="sm"
            className={cn(commonItemRounded, "bg-[var(--active)] text-[var(--active-foreground)]", "disabled:opacity-60")}
            disabled={!name.trim()} onClick={handleCreate}
          > Create </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- DeleteModal component ---
const DeleteModal = ({
  isOpen, onOpenChange, persona, personas, updateConfig, onModalClose
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  persona: string;
  personas: Record<string, string>;
  updateConfig: (config: any) => void;
  onModalClose: () => void;
}) => {
  const handleDelete = () => {
    const newPersonas = { ...personas };
    delete newPersonas[persona];
    const remainingPersonas = Object.keys(newPersonas);
    updateConfig({
      personas: newPersonas,
      persona: remainingPersonas.length > 0 ? remainingPersonas[0] : 'Ein'
    });
    onModalClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[425px]",
          "bg-[var(--bg)]", // Use main background for opacity
          "border", commonSubtleBorderClass,
          commonItemRounded, commonItemShadow,
          "text-[var(--text)]"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--text)]">Delete "{persona}"</DialogTitle>
          <DialogDescription className="text-[var(--text)]/80 pt-2">
            Are you sure you want to delete this persona? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end pt-4">
           <Button type="button" variant="outline" size="sm"
            className={cn(commonItemRounded, "text-[var(--text)] border-[var(--text)]/50", "hover:bg-[var(--text)]/10 hover:border-[var(--text)]/70")}
            onClick={onModalClose}
          > Cancel </Button>
          <Button type="button" variant="destructive" size="sm"
            className={cn(commonItemRounded)} onClick={handleDelete}
          > Delete </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- PersonaSelect component ---
const PersonaSelect = ({
  personas, persona, updateConfig, isDark
}: {
  personas: Record<string, string>;
  persona: string;
  updateConfig: (config: any) => void;
  isDark: boolean;
}) => {
  const controlBgClass = commonControlBg(isDark);
  return (
    <Select
      value={persona}
      onValueChange={(value) => updateConfig({ persona: value })}
    >
      <SelectTrigger
        className={cn(
          controlBgClass, commonSubtleBorderClass, commonInputHeight,
          "text-[var(--text)]", commonItemRounded, commonItemShadow, "w-[180px]",
          "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
          "hover:border-[var(--active)] hover:brightness-98",
          "data-[placeholder]:text-muted-foreground"
        )}
      >
        <SelectValue placeholder="Select persona" />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "bg-[var(--bg)] text-[var(--text)] border", // Use main background for opacity
          commonSubtleBorderClass,
          "rounded-md shadow-lg"
        )}
      >
        {Object.keys(personas).map((p) => (
          <SelectItem
            key={p} value={p}
            className={cn("hover:brightness-95 focus:bg-[var(--active)] focus:text-[var(--active-foreground)]", "text-[var(--text)]")}
          > {p} </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// --- PersonaTextareaWrapper ---
const PersonaTextareaWrapper = ({
  personaPrompt, setPersonaPrompt, isDark, isEditing, setIsEditing
}: {
  personaPrompt: string;
  setPersonaPrompt: (value: string) => void;
  isDark: boolean;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}) => (
  <AutoResizeTextarea
    isDark={isDark}
    value={personaPrompt}
    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        if (!isEditing) setIsEditing(true); // Auto-enable editing on change
        setPersonaPrompt(e.target.value);
    }}
    onTextAreaFocus={() => {
        if (!isEditing) setIsEditing(true); // Enable editing on focus
    }}
    isEffectivelyReadOnly={!isEditing} // Pass the read-only state for styling/behavior
    placeholder="Define the persona's characteristics and instructions here..."
  />
);

// --- Persona component (Main Accordion Item) ---
export const Persona = () => {
  const { config, updateConfig } = useConfig();
  const isDark = config?.theme === 'dark';

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditingPersona, setIsEditingPersona] = useState(false); // Controls textarea editability

  const personas = config?.personas || { Ein: "You are Ein, a helpful AI assistant." };
  const currentPersonaName = config?.persona || 'Ein';

  const defaultPromptForCurrentPersona = personas?.[currentPersonaName] ?? personas?.Ein ?? "You are Ein, a helpful AI assistant.";
  const [personaPrompt, setPersonaPrompt] = useState(defaultPromptForCurrentPersona);

  // Show Save/Cancel if textarea is being edited AND its content differs from the original
  const hasChange = isEditingPersona && personaPrompt !== defaultPromptForCurrentPersona;

  useEffect(() => {
    // When currentPersonaName or the personas object itself changes:
    // 1. Update the textarea content to the new persona's prompt.
    // 2. Reset the editing state so the textarea is initially read-only/muted.
    const newDefaultPrompt = personas?.[currentPersonaName] ?? personas?.Ein ?? "";
    setPersonaPrompt(newDefaultPrompt);
    setIsEditingPersona(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersonaName, JSON.stringify(personas)]); // Deep watch personas object

  const handlePersonaModalOpenChange = (open: boolean) => {
    setIsPersonaModalOpen(open);
    if (!open) {
      // Reset prompt to the current selected persona's default when closing create/saveAs modal
      setPersonaPrompt(defaultPromptForCurrentPersona);
      setIsEditingPersona(false);
    }
  };

  const handleOpenPersonaModalForCreate = () => {
    setPersonaPrompt(''); // Clear prompt for new persona
    setIsEditingPersona(true); // Allow immediate editing in the modal's context (though modal has its own input)
                               // For the main textarea, it will reset via useEffect when new persona is saved & selected.
    setIsPersonaModalOpen(true);
  };
  
  const handleOpenPersonaModalForSaveAs = () => {
    // Current personaPrompt is used for "Save As"
    setIsPersonaModalOpen(true);
  };

  const controlBgClass = commonControlBg(isDark);

  return (
    <AccordionItem
      value="persona"
      className={cn(
        controlBgClass, commonSubtleBorderClass, commonItemRounded, commonItemShadow,
        "transition-all duration-150 ease-in-out",
        "hover:border-[var(--active)] hover:brightness-105"
      )}
    >
      <AccordionTrigger
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 hover:no-underline",
          "text-[var(--text)] font-medium", "hover:brightness-95",
          "data-[state=open]:border-b data-[state=open]:border-[var(--text)]/5"
        )}
      >
        <SettingTitle icon="🥷" text="Persona" />
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4 pt-2 text-[var(--text)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <PersonaSelect
              persona={currentPersonaName}
              personas={personas}
              updateConfig={updateConfig}
              isDark={isDark}
            />
            <Button variant="ghost" size="sm" aria-label="Add new persona"
              className={cn("text-[var(--text)] hover:text-[var(--active)] hover:bg-[var(--text)]/10 p-1.5 rounded-md", "focus-visible:ring-1 focus-visible:ring-[var(--active)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]")}
              onClick={handleOpenPersonaModalForCreate}
            > <IoAdd className="h-5 w-5" /> </Button>
            {Object.keys(personas).length > 1 && (
              <Button variant="ghost" size="sm" aria-label="Delete current persona"
                className={cn("text-[var(--text)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 p-1.5 rounded-md", "focus-visible:ring-1 focus-visible:ring-[var(--error)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]")}
                onClick={() => setIsDeleteModalOpen(true)}
              > <IoTrashOutline className="h-5 w-5" /> </Button>
            )}
          </div>

          <PersonaTextareaWrapper
            personaPrompt={personaPrompt}
            setPersonaPrompt={setPersonaPrompt}
            isDark={isDark}
            isEditing={isEditingPersona}
            setIsEditing={setIsEditingPersona}
          />

          <SaveButtons
            hasChange={hasChange}
            onSave={() => {
              updateConfig({ personas: { ...personas, [currentPersonaName]: personaPrompt } });
              setIsEditingPersona(false); // Exit editing mode after save
            }}
            onSaveAs={handleOpenPersonaModalForSaveAs}
            onCancel={() => {
              setPersonaPrompt(defaultPromptForCurrentPersona);
              setIsEditingPersona(false); // Exit editing mode on cancel
            }}
          />
        </div>
      </AccordionContent>

      <PersonaModal
        isOpen={isPersonaModalOpen}
        onOpenChange={handlePersonaModalOpenChange}
        personaPrompt={personaPrompt}
        personas={personas}
        updateConfig={updateConfig}
        onModalClose={() => setIsPersonaModalOpen(false)} // This will trigger onOpenChange(false)
        isDark={isDark}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen} // Directly set state
        persona={currentPersonaName}
        personas={personas}
        updateConfig={updateConfig}
        onModalClose={() => setIsDeleteModalOpen(false)}
      />
    </AccordionItem>
  );
};