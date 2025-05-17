import type { TextareaHTMLAttributes, RefObject, FC } from 'react';
import { AddToChat } from './AddToChat';
import type { SpeechRecognition as SpeechRecognitionInstance, SpeechRecognitionEvent as SpeechRecognitionEventInstance, SpeechRecognitionErrorEvent as SpeechRecognitionErrorEventInstance } from '../types/speech';
import { ForwardedRef, useEffect, useRef, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { FaRegStopCircle } from 'react-icons/fa';
import { SlMicrophone } from "react-icons/sl";
import { useConfig } from './ConfigContext';
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/src/background/util";

interface AutoResizeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
  const ReactTextareaAutosize = require('react-textarea-autosize').default; 

  return (
    <ReactTextareaAutosize
      ref={ref}
      minRows={minRows}
      maxRows={maxRows}
      className={cn(
        "flex w-full rounded-xl bg-background px-3 py-1 text-sm ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "min-h-[unset]",
        "overflow-y-auto",
        "resize-none",
        "text-foreground",
        "text-sm placeholder:text-muted-foreground/75", 
        "font-semibold",
        "hover:border-foreground hover:shadow-none",
        className,
        "shadow-sm shadow-muted/20"
      )}
      {...props}
    />
  );
};
AutoResizeTextarea.displayName = 'AutoResizeTextarea';


interface InputProps {
    isLoading: boolean;
    message: string;
    setMessage: Dispatch<SetStateAction<string>>; 
    onSend: () => void;
}

export const Input: FC<InputProps> = ({ isLoading, message, setMessage, onSend }) => {
  const { config } = useConfig();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);

  const setMessageRef = useRef<Dispatch<SetStateAction<string>>>(setMessage);
  useEffect(() => {
    setMessageRef.current = setMessage;
  }, [setMessage]);

  useEffect(() => {
    ref.current?.focus();
  }, [message, config?.chatMode]);

  const placeholder = config?.chatMode === 'web' ? 'what to search?' : config?.chatMode === 'page' ? 'about the page..' : '';

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleListen = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        toast.error(
          'Speech recognition is not supported in this browser.',
          { duration: 3000 } 
        );
        return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const recognition: SpeechRecognitionInstance = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEventInstance) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setMessageRef.current((prev: string) => prev + transcript);
      };

      recognition.onend = (_event: Event) => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventInstance) => {
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
        toast.error(
          `Speech Error: ${description}`,
          { duration: 3000 }
        );
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
      toast.error(
        `Microphone Error: ${description}`,
        { duration: 3000 }
      );
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const isSpeechRecognitionSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="relative w-full flex items-center"> 
      <AddToChat /> 
      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger asChild>
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
                "not-focus",
                isListening ? "text-red-500 hover:bg-destructive/10" : "text-foreground hover:bg-muted/50",
              )}
              style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
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