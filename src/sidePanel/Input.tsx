import type { TextareaHTMLAttributes, RefObject, FC } from 'react';
import { AddToChat } from './AddToChat';
import type { SpeechRecognition as SpeechRecognitionInstance, SpeechRecognitionEvent as SpeechRecognitionEventInstance, SpeechRecognitionErrorEvent as SpeechRecognitionErrorEventInstance } from '../types/speech';
import { useEffect, useRef, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { FaRegStopCircle } from 'react-icons/fa';
import { SlMicrophone } from "react-icons/sl";
import { BsSend } from "react-icons/bs";
import { Loader2 } from 'lucide-react';
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
import { NotePopover } from './NotePopover';

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
    onFocus,
    onBlur,
    ...props
  }: AutoResizeTextareaProps & {
    ref: RefObject<HTMLTextAreaElement | null>;
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  }
) => {
  const ReactTextareaAutosize = require('react-textarea-autosize').default; 

  return (
    <ReactTextareaAutosize
      ref={ref}
      minRows={minRows}
      maxRows={maxRows}
      {...props}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        "flex w-full bg-transparent text-sm ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "min-h-[unset]",
        "overflow-y-auto",
        "resize-none",
        "text-foreground",
        "text-sm placeholder:text-muted-foreground/75", 
        "font-semibold",
        "autosize-textarea",
        "border-none shadow-none outline-none",
        className
      )}
    />
  );
};
AutoResizeTextarea.displayName = 'AutoResizeTextarea';


interface InputProps {
    isLoading: boolean;
    message: string;
    setMessage: Dispatch<SetStateAction<string>>; 
    onSend: () => void; // This is () => cognitoOnSend(cognitoMessageFromCognitoState)
}

export const Input: FC<InputProps> = ({ isLoading, message, setMessage, onSend }) => {
  const { config } = useConfig();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false); // <-- Add this

  const setMessageRef = useRef<Dispatch<SetStateAction<string>>>(setMessage);
  useEffect(() => {
    setMessageRef.current = setMessage;
  }, [setMessage]);

  useEffect(() => {
    ref.current?.focus();
  }, [message, config?.chatMode]);

  let placeholderText = 'Type a message...';
  if (config?.chatMode === 'web') {
    placeholderText = 'Enter your query...';
  } else if (config?.chatMode === 'page') {
    placeholderText = 'Ask about this page...';
  }

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
  
    const handleSendClick = () => {
    if (message.trim()) {
      onSend();
    }
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isLoading) return;
    if (event.key === 'Enter' && message.trim() && !event.altKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      onSend();
    }
  };

  return (
    <div className={cn(
      "flex w-full items-center gap-0 p-0 bg-[var(--card,var(--bg-secondary))] rounded-lg shadow-md",
      isFocused && "input-breathing"
    )}>
      <AddToChat /> 
      <AutoResizeTextarea
        ref={ref}
        minRows={1}
        maxRows={8}
        autoComplete="off"
        id="user-input"
        placeholder={placeholderText}
        value={message}
        autoFocus
        onChange={event => setMessage(event.target.value)}
        onKeyDown={handleTextareaKeyDown}
        className="flex-grow !bg-transparent px-0 py-1"
        onFocus={() => setIsFocused(true)}   // <-- Add this
        onBlur={() => setIsFocused(false)}   // <-- Add this
      />
      {isSpeechRecognitionSupported && (
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
                  "p-2 rounded-md",
                  "not-focus",
                  isListening ? "text-red-500 hover:bg-destructive/10" : "text-foreground hover:bg-muted/50",
                )}
              disabled={isLoading}
            >
                {isListening ? <FaRegStopCircle size={18} /> : <SlMicrophone size={18} />}
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
      )}
      <NotePopover />
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Send"
              variant="ghost"
              size="sm"
              className={cn(
                "p-2 rounded-md",
                !isLoading && "hover:bg-muted/50"
              )}
              onClick={handleSendClick}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-foreground" />
              ) : (
                <BsSend className="h-5 w-5 text-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-secondary/50 text-foreground"><p>Send</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};