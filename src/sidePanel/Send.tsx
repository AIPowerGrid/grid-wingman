import { IconButton, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi'; // Paper plane icon from react-icons

export const Send = ({ isLoading, onSend }: { isLoading: boolean, onSend: () => void }) => (
  <IconButton
    aria-label="Send"
    as={motion.div}
    // background="var(--bg)" /* Removed to allow ghost variant to work */
    // border="1px solid var(--text)" /* Removed to allow ghost variant to work */
    borderRadius={16}
    icon={
      isLoading ? (
        <Spinner color="var(--text)" speed="2s" />
      ) : (
        <FiSend color="var(--text)" fontSize="1.25rem" />
      )
    }
    ml={2}
    mr={2}
    size="sm"
    variant="ghost"
    whileHover={{ transform: !isLoading ? 'translateX(2px)' : undefined }}
    zIndex={2}
    onClick={onSend}
    pb={0}
    pt={0}
    minWidth="2.5rem"
    transform="translateY(2px)" /* Adjust this pixel value to shift down */
    isDisabled={isLoading || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)}
    />
);
