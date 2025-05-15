// ConnectLmStudio.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfig } from './ConfigContext';
import { cn } from "@/src/background/util";

export const ConnectLmStudio = () => {
  const { config, updateConfig } = useConfig();
  const [url, setUrl] = useState(config?.lmStudioUrl || 'http://localhost:1234');
  const [isLoading, setIsLoading] = useState(false);

  const isDark = config?.theme === 'dark';
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,250,240,0.4)]';
  const subtleBorderClass = 'border-[var(--text)]/10';
  const inputHeightClass = 'h-8';
  const buttonHeightClass = 'h-8';

  const onConnect = () => {
    setIsLoading(true);
    toast.dismiss();
    toast.loading('Connecting to LM Studio...');

    fetch(`${url}/v1/models`) // LM Studio uses OpenAI compatible endpoint
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData?.error?.message || `Connection failed: ${res.status} ${res.statusText}`);
          }).catch(() => {
            throw new Error(`Connection failed: ${res.status} ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then(data => {
        // Check for data.data as OpenAI compatible endpoints often wrap models in a 'data' array
        if (Array.isArray(data.data)) {
          updateConfig({
            lmStudioConnected: true,
            lmStudioUrl: url,
            lmStudioError: undefined,
            // Assuming you want to add a generic LM Studio entry
            // You might want to parse actual model names from data.data if needed
            models: (config?.models || []).filter(m => m.id !== 'lmstudio_generic').concat([
              { id: 'lmstudio_generic', host: 'lmstudio', active: true, name: 'LM Studio Model' }
            ]),
            selectedModel: 'lmstudio_generic' // Select this generic model
          });
          toast.dismiss();
          toast.success("Connected to LM Studio");
        } else if (data?.error) {
          updateConfig({ lmStudioError: data.error.message, lmStudioConnected: false });
          toast.dismiss();
          toast.error(data.error.message);
        } else {
          updateConfig({ lmStudioError: "Unexpected response from LM Studio", lmStudioConnected: false });
          toast.dismiss();
          toast.error('Unexpected response from LM Studio');
        }
      })
      .catch(err => {
        toast.dismiss();
        toast.error(err.message || "Failed to connect to LM Studio");
        updateConfig({ lmStudioError: err.message, lmStudioConnected: false });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const isConnected = config?.lmStudioConnected;

  return (
    <div className="flex items-center space-x-3">
      <Input
        id="lmstudio-url-input"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="http://localhost:1234"
        className={cn(
          "flex-grow", inputHeightClass, controlBg, subtleBorderClass,
          "text-[var(--text)] rounded-md shadow-sm text-sm px-2.5",
          "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)] focus:ring-offset-0",
          "hover:border-[var(--active)]"
        )}
        disabled={isLoading}
      />
      {!isConnected && (
        <Button
          onClick={onConnect}
          className={cn(
            buttonHeightClass, "px-3 text-sm font-medium whitespace-nowrap",
            "bg-[var(--active)] text-[var(--bg)] hover:bg-[var(--active)]/90 rounded-md shadow-sm",
            "focus-visible:ring-1 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
          )}
          disabled={isLoading}
        >
          {isLoading ? "..." : "Connect"}
        </Button>
      )}
      {isConnected && (
        <Button
          variant="ghost" size="sm" aria-label="Connected to LM Studio"
          className={cn(buttonHeightClass, "w-8 rounded-md text-[var(--success)]")}
          disabled={isLoading}
          onClick={onConnect}
        >
          <FiCheck className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};