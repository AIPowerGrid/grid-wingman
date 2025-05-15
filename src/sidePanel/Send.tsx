import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BsSend } from "react-icons/bs";
import { Button } from "@/components/ui/button"; // Import shadcn Button
import { cn } from "@/src/background/util"; // Use the specified path for cn

interface SendProps {
  isLoading: boolean;
  onSend: () => void;
}

export const Send = ({ isLoading, onSend }: SendProps) => {
  // Check for SpeechRecognition support (client-side check)
  const isSpeechRecognitionSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const isDisabled = isLoading || !isSpeechRecognitionSupported;

  return (
    (<motion.div>
      <Button
        aria-label="Send"
        variant="ghost" // variant="ghost"
        size="sm"      // size="sm"
        className={cn(
          "rounded-md", // borderRadius="md"
          "ml-2",       // ml={2}
          "mr-2",       // mr={2}
          "z-10",
          !isLoading && "hover:bg-muted/50"
        )}
        onClick={onSend}
        disabled={isDisabled}
      >
        {isLoading ? (
          (<Loader2 className="h-4 w-4 animate-spin text-foreground" />)
          // <Spinner color="var(--text)" speed="2s" size="xs" /> // Adjust size if needed
        ) : (
          (<BsSend className="h-4 w-4 text-foreground" />)
        )}
      </Button>
    </motion.div>)
  );
};