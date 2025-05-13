// input.tsx
import type { TextareaHTMLAttributes, RefObject, FC } from 'react';
import { AddToChat } from './AddToChat'; // Import AddToChat
import { ForwardedRef, useEffect, useRef, useState, useCallback } from 'react';
import { FaRegStopCircle } from 'react-icons/fa';
import { SlMicrophone } from "react-icons/sl";
import { useConfig } from './ConfigContext'; // Assuming path is correct
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Import toast from sonner
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/src/background/util"; // Use your cn path

// (Make sure AutoResizeTextarea component from the previous step is included)
interface AutoResizeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    // Add any specific props if needed, like minRows/maxRows if not standard HTML attributes
    minRows?: number;
    maxRows?: number;
}

export const AutoResizeTextarea = (
  {
    ref,
    className,
    minRows,
    maxRows,
    ...props
  }: AutoResizeTextareaProps & {
    ref: RefObject<HTMLTextAreaElement | null>;
  }
) => {
  // Use react-textarea-autosize if needed, otherwise style a normal textarea
  // Assuming react-textarea-autosize is still desired:
  const ReactTextareaAutosize = require('react-textarea-autosize').default; // Dynamic import if needed

  return (
    <ReactTextareaAutosize
      ref={ref}
      minRows={minRows}
      maxRows={maxRows}
      className={cn(
        // Base shadcn textarea styles
        "flex w-full rounded-xl bg-background px-3 py-1 text-sm ring-offset-background",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Original specific styles mapped to Tailwind:
        "min-h-[unset]",
        "overflow-y-auto",
        "resize-none",
        "text-foreground",
        "font-semibold",
        // Custom focus/hover (overriding shadcn focus ring)
        "focus:border-foreground focus:shadow-none",
        "hover:border-foreground hover:shadow-none",
        className
      )}
      {...props}
    />
  );
};
AutoResizeTextarea.displayName = 'AutoResizeTextarea';
// --- End of AutoResizeTextarea ---


interface InputProps {
    isLoading: boolean;
    message: string;
    setMessage: (message: string) => void;
    onSend: () => void;
}

export const Input: FC<InputProps> = ({ isLoading, message, setMessage, onSend }) => {
  const { config } = useConfig();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  // const { toast } = useToast(); // Remove this line

  // Refs and Effects for setMessage and focus (no changes needed)
  const setMessageRef = useRef(setMessage);
  useEffect(() => {
    setMessageRef.current = setMessage;
  }, [setMessage]);

  useEffect(() => {
    ref.current?.focus();
  }, [message, config?.chatMode]);

  // Placeholder logic (no changes needed)
  const placeholder = config?.chatMode === 'web' ? 'what to search?' : config?.chatMode === 'page' ? 'about the page..' : '';

  // Speech Recognition Refs and Logic
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleListen = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        // Use sonner toast directly
        toast.error('Unsupported Browser', {
            description: 'Speech recognition is not supported in this browser.',
            duration: 3000,
        });
        return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setMessageRef.current(prev => prev + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let description = 'An unknown error occurred.';
        if (event.error === 'no-speech') {
            description = 'No speech was detected. Please try again.';
        } else if (event.error === 'audio-capture') {
            description = 'Audio capture failed. Is the microphone working?';
        } else if (event.error === 'not-allowed') {
            description = 'Microphone access was denied or is blocked.';
        } else {
            description = `Error: ${event.error}`;
        }
        // Use sonner toast directly
        toast.error('Speech Error', {
          description: description,
          duration: 3000,
        });
        setIsListening(false);
        recognitionRef.current = null;
      };

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);

    } catch (err: any) {
      console.error('Mic access or setup error:', err);
      let description = 'Could not access the microphone.';
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          description = 'Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
          description = 'No microphone found. Please ensure one is connected and enabled.';
      }
      // Use sonner toast directly
      toast.error('Microphone Error', {
        description: description,
        duration: 3000,
      });
      setIsListening(false);
    }
  // No need to include `toast` in dependency array as it's a direct import
  }, []);

  // Cleanup effect (no changes needed)
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Check for SpeechRecognition support (client-side check)
  const isSpeechRecognitionSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="relative w-full flex items-center"> {/* Removed ml-2 */}
      <AddToChat /> {/* AddToChat button placed here */}
      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (isListening && recognitionRef.current) {
                   recognitionRef.current.stop();
                   setIsListening(false);
                } else if (!isListening) {
                   handleListen();
                }
              }}
              aria-label={isListening ? "Stop" : "Recording"}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-md mr-2",
                "not-focus-visible", // Add your class here
                isListening ? "text-red-500 hover:bg-destructive/10" : "text-foreground hover:bg-muted/50",
              )}
              disabled={isLoading || !isSpeechRecognitionSupported}
            >
              {isListening ? <FaRegStopCircle /> : <SlMicrophone />}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-secondary/50 text-foreground"
          >
            <p>{isListening ? "Stop" : "Recording"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AutoResizeTextarea
        ref={ref}
        minRows={1}
        maxRows={8}
        autoComplete="off"
        id="user-input"
        placeholder={placeholder}
        value={message}
        autoFocus
        onChange={event => setMessage(event.target.value)}
        onKeyDown={event => {
          if (isLoading) return;
          if (event.key === 'Enter' && message && !event.altKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            onSend();
            setMessage('');
          }
        }}
        className="z-[1]"
      />
    </div>
  );
};