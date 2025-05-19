import { useState, useEffect } from 'react';
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useConfig } from './ConfigContext';
import { getAvailableVoices, VoiceOption } from '../background/ttsUtils';
import { SettingTitle } from './SettingsTitle';
import { cn } from "@/src/background/util";

export const TtsSettings = () => {
  const { config, updateConfig } = useConfig();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const isDark = config?.theme === 'dark';
  const subtleBorderClass = 'border-[var(--text)]/10';
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,250,240,0.4)]';
  const itemShadow = 'shadow-md';
  const itemRounded = 'rounded-xl';
  const inputHeight = 'h-9';

  const sliderClass = cn(
    "w-full",
    "[&>span:first-child]:bg-[var(--text)]/10",
    "[&>span:first-child>span:first-child]:bg-[var(--active)]",
    "[&_button]:bg-[var(--active)]",
    "[&_button]:border-[var(--text)]/50",
    "[&_button]:ring-offset-[var(--bg)]",
    "[&_button:focus-visible]:ring-[var(--active)]"
  );

  useEffect(() => {
    setLoadingVoices(true);
    setErrorLoading(null);
    getAvailableVoices()
      .then((availableVoices) => {
        setVoices(availableVoices);
        if (!config.tts?.selectedVoice && availableVoices.length > 0) {
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
          if (defaultVoice) {
            updateConfig({ tts: { ...config.tts, selectedVoice: defaultVoice.name } });
          }
        }
      })
      .catch((err) => {
        console.error("Error loading TTS voices:", err);
        setErrorLoading("Could not load voices. TTS might not be available.");
      })
      .finally(() => {
        setLoadingVoices(false);
      });
  }, []);

  const handleVoiceChange = (selectedValue: string) => {
    updateConfig({
      tts: {
        ...config.tts,
        selectedVoice: selectedValue,
      },
    });
  };

  const handleRateChange = (value: number[]) => {
    updateConfig({
      tts: {
        ...config.tts,
        rate: value[0],
      },
    });
  };

  const currentRate = config.tts?.rate ?? 1;

  return (
    <AccordionItem
      value="tts-settings"
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
        <SettingTitle
          text="Text-to-Speech"
          icon="🎙️"
        />
      </AccordionTrigger>
      <AccordionContent
        className="px-3 pb-4 pt-2 text-[var(--text)]"
      >
        <div className="flex flex-col gap-6">
          {loadingVoices ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text)]" />
            </div>
          ) : errorLoading ? (
            <p className="text-[var(--error)] text-base font-medium">
              {errorLoading}
            </p>
          ) : voices.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-base font-medium text-foreground">Voice</Label>
              <Select
                value={config.tts?.selectedVoice || ''}
                onValueChange={handleVoiceChange}
              >
                <SelectTrigger
                  className={cn(
                    controlBg,
                    subtleBorderClass,
                    inputHeight,
                    "text-[var(--text)] rounded-xl shadow-md w-full",
                    "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)]",
                    "hover:border-[var(--active)] hover:brightness-98",
                    "data-[placeholder]:text-muted-foreground"
                  )}
                >
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent
                  className={cn(
                    "bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]/10 ",
                    "rounded-md shadow-lg"
                  )}
                >
                  {voices.map((voice) => (
                    <SelectItem
                      key={voice.name}
                      value={voice.name}
                      className={cn(
                        "hover:brightness-95 focus:bg-[var(--active)] focus:text-[var(--bg)]",
                        "text-[var(--text)]"
                      )}
                    >
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-base font-medium text-foreground">
              No voices available in this browser.
            </p>
          )}

          {!loadingVoices && !errorLoading && voices.length > 0 && (
            <div className="mt-2">
              <Label className="text-base font-medium text-foreground pb-3 block">
                Speech Rate: {currentRate.toFixed(1)}
              </Label>
              <Slider
                min={0.5}
                max={2}
                step={0.1}
                value={[currentRate]}
                onValueChange={handleRateChange}
                className={sliderClass}
              />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};