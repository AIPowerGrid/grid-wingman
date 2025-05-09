// ConnectCustom.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfig } from './ConfigContext';
import { cn } from "@/src/background/util";

export const ConnectCustom = () => {
  const { config, updateConfig } = useConfig();
  const [apiKey, setApiKey] = useState(config?.customApiKey || '');
  const [endpoint, setEndpoint] = useState(config?.customEndpoint || '');
  const [visibleApiKey, setVisibleApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For future async connection test

  const isDark = config?.theme === 'dark';
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.04)]' : 'bg-[rgba(255,250,240,0.6)]';
  const subtleBorderClass = 'border-[var(--text)]/10';
  const inputHeightClass = 'h-8';
  const buttonHeightClass = 'h-8';

  // For custom, "connect" primarily means saving the settings.
  // A true connection test would require knowing the endpoint structure.
  const onSaveSettings = () => {
    if (!endpoint) {
        toast.error("Custom endpoint URL is required.");
        return;
    }
    setIsLoading(true); // Simulate loading for UX consistency
    // Simulate a save operation
    setTimeout(() => {
      updateConfig({
        customApiKey: apiKey,
        customEndpoint: endpoint,
        customConnected: true, // Assume connected once saved, actual test might be separate
        customError: undefined,
        models: (config?.models || []).filter(m => m.id !== 'custom_endpoint').concat([
          { id: 'custom_endpoint', host: 'custom', name: 'Custom Endpoint Model', active: true }
        ]),
        selectedModel: 'custom_endpoint',
      });
      toast.success('Custom endpoint settings saved');
      setIsLoading(false);
    }, 500);
  };

  const onResetSettings = () => {
    setApiKey('');
    setEndpoint('');
    updateConfig({
      customApiKey: '',
      customEndpoint: '',
      customConnected: false,
      customError: undefined,
      models: (config?.models || []).filter(m => m.id !== 'custom_endpoint'),
    });
    toast.success('Custom endpoint settings reset');
  };

  const saveButtonDisabled = (!endpoint && !apiKey) || isLoading; // Disable if both are empty or loading
  const isConnected = config?.customConnected; // "Connected" means settings are saved

  return (
    <div className="space-y-2"> {/* Vertical stacking of endpoint and api key row */}
      <Input
        id="custom-endpoint-url"
        placeholder="Custom OpenAI-Compatible Endpoint URL"
        value={endpoint}
        onChange={e => setEndpoint(e.target.value)}
        className={cn(
          "w-full", inputHeightClass, controlBg, subtleBorderClass,
          "text-[var(--text)] rounded-md shadow-sm text-sm px-2.5",
          "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)] focus:ring-offset-0",
          "hover:border-[var(--active)]"
        )}
        disabled={isLoading}
      />
      <div className="flex items-center space-x-3">
        <div className="relative flex-grow">
            <Input
            id="custom-api-key"
            autoComplete="off"
            placeholder="API Key (Optional)"
            type={visibleApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className={cn(
                "w-full", inputHeightClass, controlBg, subtleBorderClass,
                "text-[var(--text)] rounded-md shadow-sm text-sm px-2.5",
                "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)] focus:ring-offset-0",
                "hover:border-[var(--active)]",
                {"pr-8": true}
            )}
            disabled={isLoading}
            />
            <Button
                variant="ghost" size="sm"
                className={cn(
                    "absolute inset-y-0 right-0 flex items-center justify-center",
                    buttonHeightClass, "w-8 text-[var(--text)]/70 hover:text-[var(--text)]"
                )}
                onClick={() => setVisibleApiKey(!visibleApiKey)}
                aria-label={visibleApiKey ? "Hide API key" : "Show API key"}
                disabled={isLoading}
            >
                {visibleApiKey ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
            </Button>
        </div>

        {!isConnected && (
          <Button
            onClick={onSaveSettings}
            className={cn(
              buttonHeightClass, "px-3 text-sm font-medium whitespace-nowrap",
              "bg-[var(--active)] text-[var(--bg)] hover:bg-[var(--active)]/90 rounded-md shadow-sm",
              "focus-visible:ring-1 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
            )}
            disabled={saveButtonDisabled}
          >
            {isLoading ? "..." : "Save"}
          </Button>
        )}
        {isConnected && (
          <>
            {/* "Saved" checkmark could replace the eye icon if API key is not sensitive or always visible after save */}
            <Button
              variant="ghost" size="sm" aria-label="Custom Endpoint Settings Saved"
              className={cn(buttonHeightClass, "w-8 rounded-md text-[var(--success)]")}
            >
              <FaCheck className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost" size="sm" aria-label="Reset Custom Endpoint Settings"
              onClick={onResetSettings}
              className={cn(buttonHeightClass, "w-8 rounded-md text-[var(--error)] hover:bg-[var(--error)]/10")}
              disabled={isLoading}
            >
              <FaTimes className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};