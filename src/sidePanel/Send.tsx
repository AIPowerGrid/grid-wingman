import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BsSend } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { cn } from "@/src/background/util";

interface SendProps {
  isLoading: boolean;
  onSend: () => void;
}

export const Send = ({ isLoading, onSend }: SendProps) => {
  const isSpeechRecognitionSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const isDisabled = isLoading || !isSpeechRecognitionSupported;

  return (
    (<motion.div>
      <Button
        aria-label="Send"
        variant="ghost" 
        size="sm" 
        className={cn(
          "rounded-md",
          "ml-2",
          "mr-2",
          "z-10",
          !isLoading && "hover:bg-muted/50" // _hover={{ bg: "rgba(0, 0, 0, 0.1)" }} -> hover:bg-muted/50 is a common ghost hover
        )}
        onClick={onSend}
        disabled={isDisabled}
      >
        {isLoading ? (
          (<Loader2 className="h-4 w-4 animate-spin text-foreground" />)
        ) : (
          (<BsSend className="h-4 w-4 text-foreground" />)
        )}
      </Button>
    </motion.div>)
  );
};