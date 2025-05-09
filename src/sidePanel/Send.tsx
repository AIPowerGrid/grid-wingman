import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { TbSend } from "react-icons/tb";
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
    // Wrap the Button with motion.div if container animations are needed
    // If no animations are applied here, this motion.div can potentially be removed.
    (<motion.div>
      <Button
        aria-label="Send"
        variant="ghost" // variant="ghost"
        size="sm"      // size="sm"
        className={cn(
          "rounded-md", // borderRadius="md"
          "ml-2",       // ml={2}
          "mr-2",       // mr={2}
          "z-10",       // zIndex={2} (using Tailwind's z-10)
          // Apply hover only when not loading
          !isLoading && "hover:bg-muted/50" // _hover={{ bg: "rgba(0, 0, 0, 0.1)" }} -> hover:bg-muted/50 is a common ghost hover
          // Ensure button is square-ish like IconButton if needed
          // size="sm" usually results in h-9 w-9 px-0 for icon-only, check if that matches
        )}
        onClick={onSend}
        disabled={isDisabled} // isDisabled={...}
      >
        {isLoading ? (
          // Use Loader2 from lucide-react (common in shadcn)
          (<Loader2 className="h-4 w-4 animate-spin text-foreground" />)
          // <Spinner color="var(--text)" speed="2s" size="xs" /> // Adjust size if needed
        ) : (
          // Use react-icon directly
          (<TbSend className="h-4 w-4 text-foreground" />) // fontSize="16px" -> h-4 w-4
        )}
      </Button>
    </motion.div>)
  );
};