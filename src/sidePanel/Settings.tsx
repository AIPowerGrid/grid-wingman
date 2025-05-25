import { Accordion } from '@/components/ui/accordion'; 
import { useConfig } from './ConfigContext';
import { Connect } from './Connect';
import { PageContext } from './PageContext';
import { ModelSettingsPanel } from './ModelSettingsPanel';
import { Persona } from './Persona';
import { Themes } from './Themes';
import { TtsSettings } from './TtsSettings';
import { WebSearch } from './WebSearch';
import { Button } from '@/components/ui/button';
import { cn } from 'src/background/util';
import { useState } from 'react';
import AnimatedBackground from './AnimatedBackground'; 

export const Settings = () => {
  const { config } = useConfig();
  const [showWarning, setShowWarning] = useState(!config?.models || config.models.length === 0);
  const [accordionValue, setAccordionValue] = useState<string>("");
  return (
    <div
      id="settings"
      className="relative z-[1] top-0 w-full h-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-transparent text-foreground px-6 pb-10 pt-[56px] scrollbar-hidden"
      >
      <AnimatedBackground />
      {showWarning && (
        <div className={cn(
          "mb-4 p-4 rounded-xl",
          "bg-[var(--active)]/20 border border-[var(--active)]",
          "text-[var(--text)]"
        )}>
          <div className="flex flex-col items-center gap-3">
            <p className="text-center font-medium">
              Please connect to your models to start chatting
            </p>
            <Button
              variant="outline-themed" // Changed variant
              // className="border-[var(--active)] hover:bg-[var(--active)]/30" // Removed className
              onClick={() => {
                setAccordionValue("connect");
                setShowWarning(false);
              }}
            >
              Connect Models
            </Button>
          </div>
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        className="w-full flex flex-col gap-4"
        value={accordionValue}
        onValueChange={setAccordionValue}
      >
        <Connect />
        <Themes /> 
        <ModelSettingsPanel />
        <Persona />
        <TtsSettings />
        <PageContext />
        <WebSearch />
        <div className="pointer-events-none h-12" /> {/* prevent the missing bottom boarder */}
      </Accordion>
    </div>
  );
};
