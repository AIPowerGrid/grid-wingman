import type { FC } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
// buttonVariants might not be needed if we style the link directly with Tailwind
// import { buttonVariants } from '@/components/ui/button';
import { ConnectGemini } from './ConnectGemini';
import { ConnectGroq } from './ConnectGroq';
import { ConnectLmStudio } from './ConnectLmStudio';
import { ConnectOllama } from './ConnectOllama';
import { ConnectOpenAI } from './ConnectOpenAI';
import { ConnectOpenRouter } from './ConnectOpenRouter';
import { ConnectCustom } from './ConnectCustom';
import { SettingTitle } from './SettingsTitle';
import { useConfig } from './ConfigContext'; // Import useConfig to get theme status
import { cn } from "@/src/background/util"; // Make sure cn is imported

type ConnectionProps = {
  title: string;
  Component: FC<unknown>; // Assuming child components don't need specific props from here
  link?: string;
};

const ConnectionSection: FC<ConnectionProps> = ({
  title,
  Component,
  link,
}) => (
  // Each ConnectionSection will be a distinct block within the accordion content
  // Adding padding and a bottom border to each section for separation
  (<div className="px-4 py-3 border-b border-[var(--text)]/10 last:border-b-0">
    <div className="flex items-center justify-between mb-2"> {/* For title and link alignment */}
      <h4 className="text-base font-medium capitalize text-foreground"> {/* Consistent heading style */}
        {title}
      </h4>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "text-xs inline-flex items-center gap-1", // Smaller text, gap for icon
            "text-[var(--link)] hover:text-[var(--active)] hover:underline", // Use theme link/active colors
            "focus-visible:ring-1 focus-visible:ring-[var(--ring)] rounded-sm p-0.5" // Focus style
          )}
        >
          API Keys
          <FiExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
    {/* The actual connection component (e.g., ConnectOllama) */}
    <Component />
  </div>)
);

export const Connect: FC = () => {
  const { config } = useConfig(); // Get config to determine theme for styling variables

  // Consistent styling variables
  const isDark = config?.theme === 'dark';
  const subtleBorderClass = 'border-[var(--text)]/10'; // For the main accordion item
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.04)]' : 'bg-[rgba(255,250,240,0.6)]';
  const itemShadow = 'shadow-md';
  const itemRounded = 'rounded-xl';

  return (
    <AccordionItem
      value="connections"
      className={cn(
        controlBg,
        subtleBorderClass,
        itemRounded,
        itemShadow,
        "transition-all duration-150 ease-in-out",
        "hover:border-[var(--active)] hover:brightness-105",
        "overflow-hidden" // Keep overflow-hidden if it helps with internal layout
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
        <SettingTitle icon="♾️" text="Connect" />
      </AccordionTrigger>
      <AccordionContent className="p-0 text-[var(--text)]"> {/* Removed padding, set base text color */}
        {/* The ConnectionSection components will now provide their own internal padding */}
        <ConnectionSection Component={ConnectOllama} title="Ollama" />
        <ConnectionSection Component={ConnectLmStudio} title="LM Studio" />
        <ConnectionSection
          Component={ConnectGroq}
          link="https://console.groq.com/keys"
          title="Groq"
        />
        <ConnectionSection
          Component={ConnectGemini}
          link="https://aistudio.google.com/app/apikey"
          title="Gemini"
        />
        <ConnectionSection
          Component={ConnectOpenAI}
          link="https://platform.openai.com/api-keys"
          title="OpenAI"
        />
        <ConnectionSection
          Component={ConnectOpenRouter}
          link="https://openrouter.ai/settings/keys"
          title="OpenRouter"
        />
        <ConnectionSection
          Component={ConnectCustom}
          title="OpenAI Compatible Endpoint" // More descriptive title
        />
      </AccordionContent>
    </AccordionItem>
  );
};