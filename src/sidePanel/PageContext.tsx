import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { cn } from "@/src/background/util";
import { useConfig } from './ConfigContext';
import { SettingTitle } from './SettingsTitle';


const sliderClass = cn(
  "w-full",
  "[&>span:first-child]:bg-[var(--text)]/10",
  "[&>span:first-child>span:first-child]:bg-[var(--active)]",
  "[&_button]:bg-[var(--active)]",
  "[&_button]:border-[var(--text)]/50",
  "[&_button]:ring-offset-[var(--bg)]",
  "[&_button:focus-visible]:ring-[var(--active)]"
);

interface ContextLimitSliderProps {
  size: number;
  updateConfig: ReturnType<typeof useConfig>['updateConfig'];
}

const ContextLimitSlider = ({ size, updateConfig }: ContextLimitSliderProps) => (
  <div className="w-full">
    <p className="text-[var(--text)] text-base font-medium pb-6 text-left">
      Char Limit:{' '}
      <span className="font-normal">{size === 128 ? 'inf' : `${size}k`}</span>
    </p>
    <Slider
      defaultValue={[size]}
      max={128}
      min={1}
      step={1}
      className={sliderClass}
      onValueChange={(value: number[]) => updateConfig({ contextLimit: value[0] })}
    />
  </div>
);

export const PageContext = () => {
  const { config, updateConfig } = useConfig();
  const size = config?.contextLimit || 1;

  return (
    <AccordionItem
      value="page-context"
      className={cn(
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