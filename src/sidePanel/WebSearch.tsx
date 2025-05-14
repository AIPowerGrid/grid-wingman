import { useEffect } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from "@/src/background/util";
import { Checkbox } from "@/components/ui/checkbox";

import { useConfig } from './ConfigContext';
import type { Config } from '../types/config';
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

interface WebSearchModeSelectorProps {
  webMode: Config['webMode'];
  updateConfig: (newConfig: Partial<Config>) => void;
}

const WebSearchModeSelector = ({ webMode, updateConfig }: WebSearchModeSelectorProps) => (
  <RadioGroup
    value={webMode}
    onValueChange={(value) => updateConfig({ webMode: value as Config['webMode'] })} // Ensure type safety
    className="w-1/2 space-y-3"
  >
    {['Duckduckgo', 'Brave', 'Google', 'Wikipedia'].map(mode => (
      <div key={mode} className="flex items-center space-x-2">
        <RadioGroupItem
          value={mode}
          id={`webMode-${mode}`}
          className={cn(
            "border-[var(--text)] text-[var(--active)]",
            "focus:ring-1 focus:ring-[var(--active)] focus:ring-offset-0",
            "data-[state=checked]:border-[var(--active)]"
          )}
        />
        <Label
          htmlFor={`webMode-${mode}`}
          className="text-[var(--text)] text-base font-medium cursor-pointer"
        >
          {mode}
        </Label>
      </div>
    ))}
  </RadioGroup>
);

// --- NEW: Panel for SERP specific settings (DuckDuckGo, Brave, Google) ---
interface SerpSettingsPanelProps {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}

const SerpSettingsPanel = ({ config, updateConfig }: SerpSettingsPanelProps) => {
  // Default to 16k for charLimit if undefined, consistent with useEffect
  const charLimit = config?.webLimit ?? 16;
  // Default to 3 for maxLinks if undefined, consistent with useEffect
  const maxLinks = config?.serpMaxLinksToVisit ?? 3;

  return (
    <div className="w-[45%] space-y-4 pl-4">
      <div>
        <p className="text-[var(--text)] text-base font-medium pb-2 text-left">
          Max Links to Visit: <span className="font-normal">{maxLinks}</span>
        </p>
        <Slider
          defaultValue={[maxLinks]}
          max={10} // Sensible max, e.g., 10 links
          min={1}
          step={1}
          className={sliderClass}
          onValueChange={value => updateConfig({ serpMaxLinksToVisit: value[0] })}
        />
        <p className="text-[var(--text)]/70 text-xs pt-1">
          Number of search result pages to fetch and summarize.
        </p>
      </div>

      <div className="pt-2"> {/* Added pt-2 for spacing */}
        <p className="text-[var(--text)] text-base font-medium pb-2 text-left">
          Content Char Limit per Page:{' '}
          <span className="font-normal">{charLimit === 128 ? 'Unlimited' : `${charLimit}k`}</span>
        </p>
        <Slider
          defaultValue={[charLimit]}
          max={128} // 128 means unlimited
          min={1}   // e.g., 1k chars
          step={1}
          className={sliderClass}
          onValueChange={value => updateConfig({ webLimit: value[0] })}
        />
         <p className="text-[var(--text)]/70 text-xs pt-1">
          Max characters of content to use from each visited page. 'Unlimited' uses full content.
        </p>
      </div>
    </div>
  );
};
// --- END: SerpSettingsPanel ---

interface WikipediaSettingsPanelProps {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}

const WikipediaSettingsPanel = ({ config, updateConfig }: WikipediaSettingsPanelProps) => {
  const numBlocks = config?.wikiNumBlocks ?? 3; // Default to 3
  const rerankEnabled = config?.wikiRerank ?? false; // Default to false
  // Default to 10, or numBlocks if larger, consistent with useEffect
  const numBlocksToRerank = config?.wikiNumBlocksToRerank ?? Math.max(numBlocks, 10);


  return (
    <div className="w-[45%] space-y-4 pl-4">
      <div>
        <p className="text-[var(--text)] text-base font-medium pb-2 text-left">
          Number of Results: <span className="font-normal">{numBlocks}</span>
        </p>
        <Slider
          defaultValue={[numBlocks]}
          max={30} // API max is 300, practical UI max
          min={1}
          step={1}
          className={sliderClass}
          onValueChange={value => updateConfig({ wikiNumBlocks: value[0] })}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="wikiRerank"
          checked={rerankEnabled}
          onCheckedChange={(checked) => updateConfig({ wikiRerank: !!checked })}
          className={cn(
            "border-[var(--text)] data-[state=checked]:bg-[var(--active)] data-[state=checked]:text-[var(--bg)]",
            "focus-visible:ring-1 focus-visible:ring-[var(--active)] focus-visible:ring-offset-0"
          )}
        />
        <Label
          htmlFor="wikiRerank"
          className="text-[var(--text)] text-base font-medium cursor-pointer"
        >
          Enable LLM Reranking
        </Label>
      </div>

      {rerankEnabled && (
        <div>
          <p className="text-[var(--text)] text-base font-medium pb-2 text-left pt-2">
            Number to Rerank: <span className="font-normal">{numBlocksToRerank}</span>
          </p>
          <Slider
            defaultValue={[numBlocksToRerank]}
            max={50} // API max is 300, practical UI max
            min={numBlocks} // Must be >= num_blocks
            step={1}
            className={sliderClass}
            onValueChange={value => updateConfig({ wikiNumBlocksToRerank: value[0] })}
            disabled={!rerankEnabled}
          />
           <p className="text-[var(--text)]/70 text-xs pt-1">
            More items for reranking can improve quality but takes longer.
          </p>
        </div>
      )}
    </div>
  );
};

export const WebSearch = () => {
  const { config, updateConfig } = useConfig();
  const isDark = config?.theme === 'dark';

  // Effect for Wikipedia settings defaults and constraints
  useEffect(() => {
    if (config?.webMode === 'Wikipedia') {
      const updates: Partial<Config> = {};
      if (typeof config.wikiNumBlocks === 'undefined') {
        updates.wikiNumBlocks = 3;
      }
      if (config.wikiRerank && typeof config.wikiNumBlocksToRerank === 'undefined') {
        updates.wikiNumBlocksToRerank = Math.max(config.wikiNumBlocks || 3, 10);
      }
      // Ensure wikiNumBlocksToRerank is always >= wikiNumBlocks if rerank is true
      if (config.wikiRerank && config.wikiNumBlocks && config.wikiNumBlocksToRerank) {
        if (config.wikiNumBlocksToRerank < config.wikiNumBlocks) {
          updates.wikiNumBlocksToRerank = config.wikiNumBlocks;
        }
      }
      if (Object.keys(updates).length > 0) {
        updateConfig(updates);
      }
    }
  }, [config?.webMode, config?.wikiRerank, config?.wikiNumBlocks, config?.wikiNumBlocksToRerank, updateConfig]);

  // Effect for SERP settings defaults
  useEffect(() => {
    if (
      config?.webMode === 'Duckduckgo' ||
      config?.webMode === 'Brave' ||
      config?.webMode === 'Google'
    ) {
      const updates: Partial<Config> = {};
      if (typeof config?.serpMaxLinksToVisit === 'undefined') {
        updates.serpMaxLinksToVisit = 3; // Default to 3 links
      }
      if (typeof config?.webLimit === 'undefined') {
        updates.webLimit = 16; // Default to 16k char limit
      }
      if (Object.keys(updates).length > 0) {
        updateConfig(updates);
      }
    }
  }, [config?.webMode, config?.serpMaxLinksToVisit, config?.webLimit, updateConfig]);


  const subtleBorderClass = 'border-[var(--text)]/10';
  const controlBg = isDark
    ? 'bg-[rgba(255,255,255,0.1)]'
    : 'bg-[rgba(255,250,240,0.4)]';
  const itemShadow = 'shadow-md';
  const itemRounded = 'rounded-xl';

  return (
    <AccordionItem
      value="web-search"
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
          icon="🌐"
          text="Web Search"
        />
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4 pt-2 text-[var(--text)]">
      <div className="flex">
          <WebSearchModeSelector updateConfig={updateConfig} webMode={config?.webMode} />
          {config?.webMode === 'Wikipedia' ? (
            <WikipediaSettingsPanel config={config} updateConfig={updateConfig} />
          ) : (
            <SerpSettingsPanel config={config} updateConfig={updateConfig} />
          )}
          </div>
          </AccordionContent>
          </AccordionItem>
  );
};