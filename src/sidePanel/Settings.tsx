import { Accordion } from '@/components/ui/accordion'; 
import { useConfig } from './ConfigContext';
import { Connect } from './Connect';
import { PageContext } from './PageContext';
import { ModelSettingsPanel } from './ModelSettingsPanel';
import { Persona } from './Persona';
import { Themes } from './Themes';
import { TtsSettings } from './TtsSettings';
import { WebSearch } from './WebSearch'; 


export const Settings = () => {
  const { config } = useConfig();
  const defaultIndex = (config?.models || [])?.length === 0 ? 1 : undefined;
  const isDark = config?.theme === 'dark';

  const subtleBorderClass = 'border-[var(--text)]/10';
  const controlBg = isDark
    ? 'bg-[rgba(255,255,255,0.1)]' 
    : 'bg-[rgba(255,250,240,0.4)]';
  const itemShadow = 'shadow-md'; 
  const itemRounded = 'rounded-xl'; 

  return (
    <div
      id="settings"
      className="relative z-[1] top-0 w-full h-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-transparent text-foreground px-6 pb-10 pt-[56px] scrollbar-hidden"
      >
      <Accordion
        type="single" // Or "multiple" if you want multiple items open
        collapsible
        className="w-full flex flex-col gap-4"
      >
        <Themes /> 
        <Connect />
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
