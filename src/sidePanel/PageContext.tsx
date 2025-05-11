import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from "@/src/background/util";
import { useConfig } from './ConfigContext';
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

const PageModeSelector = ({ pageMode, updateConfig }) => (
  <RadioGroup
    value={pageMode || 'text'}
    onValueChange={(value) => updateConfig({ pageMode: value })}
    className="w-1/2 space-y-3"
  >
    {['text', 'html'].map(mode => (
      <div key={mode} className="flex items-center space-x-2">
        <RadioGroupItem
          value={mode}
          id={`pageMode-${mode}`}
          className={cn(
            "border-[var(--text)] text-[var(--active)]",
            "focus:ring-1 focus:ring-[var(--active)] focus:ring-offset-0",
            "data-[state=checked]:border-[var(--active)]"
          )}
        />
        <Label
          htmlFor={`pageMode-${mode}`}
          className="text-[var(--text)] text-base font-medium cursor-pointer"
        >
          {mode} mode
        </Label>
      </div>
    ))}
  </RadioGroup>
);

const ContextLimitSlider = ({ size, updateConfig }) => (
  <div className="w-[45%] ml-auto">
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
      onValueChange={value => updateConfig({ contextLimit: value[0] })}
    />
  </div>
);

export const PageContext = () => {
  const { config, updateConfig } = useConfig();
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
        <div className="flex">
          <PageModeSelector pageMode={config?.pageMode} updateConfig={updateConfig} />
          <ContextLimitSlider size={size} updateConfig={updateConfig} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};