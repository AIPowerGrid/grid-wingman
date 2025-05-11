// ConnectOllama.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiWifi, FiWifiOff } from 'react-icons/fi'; // Added Wifi icons
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfig } from './ConfigContext';
import { cn } from "@/src/background/util"; // Import cn

export const ConnectOllama = () => {
  const { config, updateConfig } = useConfig();
  const [url, setUrl] = useState(config?.ollamaUrl || 'http://localhost:11434');
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  // Styling variables (can be moved to a shared constants file if used in many places)
  const isDark = config?.theme === 'dark'; // For controlBg, if needed, though direct vars are used below
  const controlBg = isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,250,240,0.4)]';
  const subtleBorderClass = 'border-[var(--text)]/10';
  const inputHeightClass = 'h-8'; // Target height: 2rem or 32px. Adjust as needed (e.g., h-9 for 36px)
  const buttonHeightClass = 'h-8'; // Match input height

  const onConnect = () => {
    setIsLoading(true);
    toast.dismiss(); // Dismiss any existing toasts
    toast.loading('Connecting to Ollama...'); // Loading toast

    fetch(`${url}/api/tags`)
      .then(res => {
        if (!res.ok) { // Check for non-2xx responses
          // Try to parse error from Ollama if possible, otherwise use status text
          return res.json().then(errData => {
            throw new Error(errData?.error || `Connection failed: ${res.status} ${res.statusText}`);
          }).catch(() => { // If res.json() fails (e.g. not JSON response)
            throw new Error(`Connection failed: ${res.status} ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then(data => {
        // data.models is an array in Ollama's /api/tags response
        if (Array.isArray(data.models)) {
          updateConfig({
            ollamaConnected: true,
            ollamaUrl: url,
            ollamaError: undefined,
            // Optionally store models if your app uses them
            // models: config.models.filter(m => m.host !== 'ollama').concat(data.models.map(m => ({...m, host: 'ollama', active: true})))
          });
          toast.dismiss();
          toast.success('Connected to Ollama');
        } else if (data?.error) { // Some Ollama versions might return error this way
          updateConfig({ ollamaError: data.error, ollamaConnected: false });
          toast.dismiss();
          toast.error(typeof data.error === 'string' ? data.error : "Ollama connection error");
        } else { // Unexpected response structure
          updateConfig({ ollamaError: "Unexpected response from Ollama", ollamaConnected: false });
          toast.dismiss();
          toast.error('Unexpected response from Ollama');
        }
      })
      .catch(err => {
        toast.dismiss();
        toast.error(err.message || "Failed to connect to Ollama");
        updateConfig({
          ollamaError: err.message,
          ollamaConnected: false,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const isConnected = config?.ollamaConnected;

  return (
    // The parent ConnectionSection provides px-4. This div provides vertical spacing for elements within.
    // If ConnectionSection had pb-3, this mb-0 might be fine.
    // If ConnectionSection has no bottom padding, this might need it.
    // For now, assuming ConnectionSection handles its own py-3.
    <div className="flex items-center space-x-3"> {/* Increased space-x-2 to space-x-3 for more margin */}
      <Input
        id="ollama-url-input" // More specific ID
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="http://localhost:11434"
        className={cn(
          "flex-grow", // Takes available space
          inputHeightClass,
          controlBg, // Use consistent background
          subtleBorderClass, // Use consistent border
          "text-[var(--text)] rounded-md shadow-sm text-sm", // Consistent text, rounding, shadow, font size
          "focus:border-[var(--active)] focus:ring-1 focus:ring-[var(--active)] focus:ring-offset-0", // Consistent focus
          "hover:border-[var(--active)]", // Consistent hover
          "px-2.5" // Horizontal padding for the input text (py is handled by h-8)
        )}
        disabled={isLoading}
      />
      {!isConnected && (
        <Button
          onClick={onConnect}
          className={cn(
            buttonHeightClass, // Match input height
            "px-3", // Reduced horizontal padding for "Connect" button text
            "text-sm font-medium whitespace-nowrap", // Ensure text doesn't wrap
            "bg-[var(--active)] text-[var(--bg)] hover:bg-[var(--active)]/90",
            "rounded-md shadow-sm",
            "focus-visible:ring-1 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
          )}
          disabled={isLoading}
        >
          {isLoading ? "..." : "Connect"}
        </Button>
      )}
      {isConnected && (
        <Button
          variant="ghost" // Use ghost for a less prominent connected indicator, or keep 'outline'
          size="sm"
          aria-label="Connected to Ollama"
          className={cn(
            buttonHeightClass, "w-8", // Explicit height and width
            // "bg-green-500/10 text-green-700 dark:bg-green-700/20 dark:text-green-400", // Example success colors
            // "border-green-500/30",
            "rounded-md", // Standard rounding
            // No need for explicit bg/border if using an icon that shows status
            "text-[var(--success)]" // Use success color for the icon
          )}
          // onClick={onConnect} // Optionally make it re-test connection
        >
          <FiCheck className="h-5 w-5" /> {/* Slightly larger check icon */}
        </Button>
      )}
    </div>
  );
};