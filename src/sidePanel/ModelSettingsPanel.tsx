// src/sidePanel/ModelSettingsPanel.tsx
import { useConfig } from './ConfigContext';
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { SettingTitle } from './SettingsTitle';
import { cn } from "@/src/background/util"; // Ensure cn is imported

// Define a type for the keys of model parameters that handleChange will manage
type ModelParamKey = 'temperature' | 'maxTokens' | 'topP' | 'presencepenalty';

export const ModelSettingsPanel = () => {
  const { config, updateConfig } = useConfig();

  // Consistent styling variables (from TtsSettings.tsx)
  const isDark = config?.theme === 'dark';
  const subtleBorderClass = 'border-[var(--text)]/10';
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,250,240,0.4)]';
  const itemShadow = 'shadow-md';
  const itemRounded = 'rounded-xl';
  const inputHeight = 'h-9';

  // Consistent Slider class string
  const sliderClass = cn(
    "w-full",
    // Track background (unfilled part) - use a subtle color
    "[&>span:first-child]:bg-[var(--text)]/10",
    // Range (filled part) - use active color
    "[&>span:first-child>span:first-child]:bg-[var(--active)]",
    // Thumb styling
    "[&_button]:bg-[var(--active)]",
    "[&_button]:border-[var(--text)]/50",
    "[&_button]:ring-offset-[var(--bg)]",
    "[&_button:focus-visible]:ring-[var(--active)]"
  );

  const handleChange = (key: ModelParamKey) => (val: number | number[]) => {
    const valueToSet = Array.isArray(val) ? val[0] : val;
    updateConfig({ [key]: valueToSet });
  };

  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 32048;
  const topP = config.topP ?? 0.95;
  const presence_penalty = config.presencepenalty ?? 0;

  return (
    <AccordionItem
      value="model-params"
      className={cn(
        controlBg,
        subtleBorderClass,
        itemRounded,
        itemShadow,
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
        <SettingTitle icon="⚙️" text="Model Parameters" />
      </AccordionTrigger>
      <AccordionContent
        className="px-3 pb-4 pt-2 text-[var(--text)]"
      >
        <div className="flex flex-col gap-6">
          {/* Temperature */}
          <div className="space-y-3">
            <Label htmlFor="temperature" className="text-base font-medium text-foreground">
              Temperature ({temperature.toFixed(2)})
            </Label>
            <Slider
              id="temperature"
              min={0} max={1} step={0.01}
              value={[temperature]}
              onValueChange={handleChange('temperature')}
              className={sliderClass} // Apply consistent slider class
            />
          </div>

          {/* Max Output Tokens */}
          <div className="space-y-3">
            <Label htmlFor="maxTokens" className="text-base font-medium text-foreground">
              Max Tokens ({maxTokens})
            </Label>
            <Input
              id="maxTokens"
              type="number"
              value={maxTokens}
              min={1}
              max={1280000}
              onChange={(e) => handleChange('maxTokens')(parseInt(e.target.value, 10) || 0)}
              className={cn(
                controlBg,
                subtleBorderClass,
                inputHeight,
                "text-[var(--text)] rounded-xl shadow-md w-full px-3",
                "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
                "hover:border-[var(--active)] hover:brightness-98"
              )}
            />
          </div>

          {/* Top P */}
          <div className="space-y-3">
            <Label htmlFor="topP" className="text-base font-medium text-foreground">
              Top P ({topP.toFixed(2)})
            </Label>
            <Slider
              id="topP"
              min={0} max={1} step={0.01}
              value={[topP]}
              onValueChange={handleChange('topP')}
              className={sliderClass} // Apply consistent slider class
            />
          </div>

          {/* presence_penalty */}
          <div className="space-y-3">
            <Label htmlFor="presencepenalty" className="text-base font-medium text-foreground">
            Presence Penalty ({presence_penalty.toFixed(2)})
            </Label>
            <Slider
              id="presencepenalty"
              min={-2}
              max={2}
              step={0.01}
              value={[presence_penalty]}
              onValueChange={handleChange('presencepenalty')}
              className={sliderClass} // Apply consistent slider class
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};