// src/sidePanel/Settings.tsx
import { Accordion } from '@/components/ui/accordion'; // Import Shadcn Accordion
import { useConfig } from './ConfigContext';
import { Connect } from './Connect';
import { PageContext } from './PageContext';
import { ModelSettingsPanel } from './ModelSettingsPanel';
import { Persona } from './Persona';
import { Themes } from './Themes';
import { TtsSettings } from './TtsSettings';
import { WebSearch } from './WebSearch'; // Remove unused imports


export const Settings = () => {
  const { config } = useConfig();
  const defaultIndex = (config?.models || [])?.length === 0 ? 1 : undefined;
  const isDark = config?.theme === 'dark';

  // Define common styles for accordion items, mirroring Header.tsx controls.
  // These styles will be applied within child components like Themes.tsx, Connect.tsx, etc.
  const subtleBorderClass = 'border-[var(--text)]/10'; // 1px semi-transparent border
  const controlBg = isDark
    ? 'bg-[rgba(255,255,255,0.1)]' // Brighter solid color for dark theme
    : 'bg-[rgba(255,250,240,0.4)]'; // Brighter solid color for light theme
  const itemShadow = 'shadow-md'; // Consistent shadow, same as Header.tsx's floatingShadow
  const itemRounded = 'rounded-xl'; // Consistent rounding

  // --- Example of how these classes would be used in a child component (e.g., Themes.tsx) ---
  //
  // AccordionItem:
  //   className={cn(controlBg, subtleBorderClass, itemRounded, itemShadow, "overflow-hidden")}
  // AccordionTrigger:
  //   className={cn("flex items-center justify-between w-full px-4 py-3 text-[var(--text)] font-medium hover:brightness-95 data-[state=open]:border-b data-[state=open]:border-[var(--text)]/5")}
  // AccordionContent:
  //   className={cn("px-4 pb-4 pt-2 text-[var(--text)]")}
  // const floatingShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'; // This is Tailwind's 'shadow-md'
  // const hoverFilter = `${controlFilter} brightness(0.98)`;

  return (
    // Replace Box with div and apply Tailwind classes
    <div
      id="settings"
      className="relative z-[1] top-0 w-full h-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-transparent text-foreground px-6 pb-10 pt-[56px] scrollbar-hidden"
      >
      {/* Accordion container */}
      {/* Apply styling via className and Tailwind. */}
      {/* on the Accordion and potentially within each child component's AccordionItem */}
      <Accordion
        type="single" // Or "multiple" if you want multiple items open
        collapsible
        className="w-full flex flex-col gap-4" // Removed pb-4 from Accordion, gap-4 handles inter-item spacing
        // defaultValue={defaultIndex !== undefined ? "connections" : undefined} // Example: Set default open item by value if needed
      >
        {/* Render Accordion Items */}
        <Themes /> {/* Uncommented */}
        <Connect />
        <ModelSettingsPanel /> {/* Uncommented */}
        <Persona />
        <TtsSettings /> {/* Uncommented */}
        <PageContext />
        <WebSearch />
        <div className="pointer-events-none h-12" /> {/* prevent the missing bottom boarder */}
      </Accordion>
    </div>
  );
};
