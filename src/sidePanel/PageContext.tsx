import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { cn } from "@/src/background/util";
import { useConfig } from './ConfigContext'; // Assuming this provides { config: Config, updateConfig: (updates: Partial<Config>) => void }
import { SettingTitle } from './SettingsTitle';


// Consistent Slider class string (copied from ModelSettingsPanel.tsx)
const sliderClass = cn(
  "w-full",
  // Track background (unfilled part)
  "[&>span:first-child]:bg-[var(--text)]/10",
  // Range (filled part)
  "[&>span:first-child>span:first-child]:bg-[var(--active)]",
  // Thumb styling
  "[&_button]:bg-[var(--active)]",
  "[&_button]:border-[var(--text)]/50",
  "[&_button]:ring-offset-[var(--bg)]",
  "[&_button:focus-visible]:ring-[var(--active)]"
);

interface ContextLimitSliderProps {
  size: number;
  // This typing assumes useConfig() returns an object with an updateConfig method.
  // Adjust if your useConfig hook has a more specific exported type for its return value or for updateConfig.
  updateConfig: ReturnType<typeof useConfig>['updateConfig'];
}

const ContextLimitSlider = ({ size, updateConfig }: ContextLimitSliderProps) => (
  <div className="w-full"> {/* Changed from w-[45%] ml-auto to take full width */}
    <p className="text-[var(--text)] text-base font-medium pb-6 text-left">
      Char Limit:{' '}
      <span className="font-normal">{size === 128 ? 'inf' : `${size}k`}</span>
    </p>
    <Slider
      defaultValue={[size]}
      max={128}
      min={1}
      step={1}
      className={sliderClass} // Apply consistent slider class
      onValueChange={(value: number[]) => updateConfig({ contextLimit: value[0] })}
    />
  </div>
);

export const PageContext = () => {
  const { config, updateConfig } = useConfig();
  // Ensure default for size is reasonable, 1 seems fine as slider min is 1.
  const size = config?.contextLimit || 1;
  const isDark = config?.theme === 'dark';

  const subtleBorderClass = 'border-[var(--text)]/10';
  const controlBg = isDark
    ? 'bg-[rgba(255,255,255,0.1)]'
    : 'bg-[rgba(255,250,240,0.4)]';
  const itemShadow = 'shadow-md';
  const itemRounded = 'rounded-xl';

  return (
    <AccordionItem
      value="page-context"
      className={cn(
        controlBg,
        subtleBorderClass,
        itemRounded,
        itemShadow,
        "overflow-hidden",
        "transition-all duration-150 ease-in-out",
        "hover:border-[var(--active)] hover:brightness-105"
      )}
    >
      <AccordionTrigger
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 hover:no-underline",
          "text-[var(--text)] font-medium",
          "hover:brightness-95",
          "data-[state=open]:border-b data-[state=open]:border-[var(--text)]/5"
        )}
      >
        <SettingTitle
          icon="📃"
          text="Page Context"
        />
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4 pt-2 text-[var(--text)]">
        <ContextLimitSlider size={size} updateConfig={updateConfig} />
      </AccordionContent>
    </AccordionItem>
  );
};