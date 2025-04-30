import React, {
 ForwardedRef, useEffect, useRef, useState, useCallback 
} from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { Box, Textarea, IconButton, Tooltip, useToast } from '@chakra-ui/react';
import { FaMicrophone, FaStopCircle } from 'react-icons/fa'; // Import mic icons
import { useConfig } from './ConfigContext';

export const AutoResizeTextarea = React.forwardRef((props, ref) => (
  <Textarea
    ref={ref as ForwardedRef<HTMLTextAreaElement>}
    as={ResizeTextarea}
    maxRows={8}
    minH="unset"
    minRows={1}
    overflow="scroll"
    resize="none"
    w="100%"
    {...props}
    p={1}
  />
));
AutoResizeTextarea.displayName = 'AutoResizeTextarea';


interface InputProps {
    isLoading: boolean;
    message: string;
    setMessage: (message: string) => void;
    onSend: () => void;
    // Add any other props if needed
}

export const Input: React.FC<InputProps> = ({ isLoading, message, setMessage, onSend }) => {
const { config } = useConfig();
const ref = useRef<HTMLTextAreaElement>(null);
const [isListening, setIsListening] = useState(false);
const toast = useToast(); // For showing errors
const isStartingRef = useRef(false); // Ref to prevent rapid re-entry during start
const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for debounce timeout

// Use a ref to ensure we always have the latest setMessage without causing effect re-runs
const setMessageRef = useRef(setMessage);
useEffect(() => {
  setMessageRef.current = setMessage;
}, [setMessage]);


  useEffect(() => {
    ref.current?.focus();
  }, [message, config?.chatMode]);

const placeholder = config?.chatMode === 'web' ? 'what to search?' : config?.chatMode === 'page' ? 'about the page..' : '';

const recognitionRef = useRef<SpeechRecognition | null>(null);

const handleListen = useCallback(async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: 'Speech Error',
        description: event.error,
        status: 'error',
        duration: 4000,
      });
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  } catch (err) {
    console.error('Mic access error:', err);
    toast({
      title: 'Microphone access needed',
      description: 'Please allow access to the microphone in your browser settings.',
      status: 'error',
      duration: 5000
    });
  }
}, []);

const handleStop = () => {
  recognitionRef.current?.stop();
  recognitionRef.current = null;
  setIsListening(false);
};


useEffect(() => {
  return () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };
}, []);

  return (    
  <Box ml={2} position="relative" width="100%" display="flex" alignItems="center">
      <Tooltip label={isListening ? "Stop Listening" : "Start Listening"} placement="top" hasArrow>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleListen();
          }}
          aria-label={isListening ? "Stop Listening" : "Start Listening"}
          icon={isListening ? <FaStopCircle /> : <FaMicrophone />}
          variant="ghost"
          size="sm"
          mr={2}
          color={isListening ? "red.500" : "currentColor"}
          isDisabled={isLoading || !(window.SpeechRecognition || window.webkitSpeechRecognition)}
          _hover={{ bg: 'rgba(128, 128, 128, 0.1)' }}
        />
      </Tooltip>

      <AutoResizeTextarea
        ref={ref}
        _focus={{
          borderColor: 'var(--text)',
          boxShadow: 'none !important'
        }}
        _hover={{
          borderColor: 'var(--text)',
          boxShadow: 'none !important'
        }}
        autoComplete="off"
        background="var(--bg)"
        border="1px"
        borderColor="var(--text)"
        borderRadius={16}
        color="var(--text)"
        fontSize="md"
        fontStyle="bold"
        fontWeight={600}
        id="user-input"
        placeholder={placeholder}
        position="relative"
        pl={4}
        pr={12}
        size="sm"
        value={message}
        width="100%"
        zIndex={1}
        autoFocus
        p={1}
        onChange={event => setMessage(event.target.value)}
        onKeyDown={event => {
          if (isLoading) return;

          if (event.keyCode === 13 && message && !event.altKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            onSend();
            setMessage('');
          }
        }}
      />
    </Box>
  );
};
