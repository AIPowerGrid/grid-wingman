import { useState, useLayoutEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiCopy } from 'react-icons/fi';
import { FiRepeat } from 'react-icons/fi';
import { Box, IconButton } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { SlVolume2 } from "react-icons/sl";
import { MessageTurn } from './ChatHistory';
import { Message } from './Message';
import {speakMessage} from '../util/ttsUtils';

// Define the props interface for better type safety
interface MessagesProps {
  turns?: MessageTurn[];
  isLoading?: boolean;
  onReload?: () => void;
  settingsMode?: boolean;
}

export const Messages: React.FC<MessagesProps> = ({
 turns = [], isLoading = false, onReload = () => {}, settingsMode = false
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
    // --- Ref for the scrollable container ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container itself

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Only scroll if user is near the bottom (not scrolled up)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [turns]);

  return (
    <Box
      ref={containerRef} // Add ref here
      background="var(--bg)"
      display="flex"
      flexDir="column"
      flexGrow={1}
      id="messages"  
      height="calc(100vh - 10rem)"
      overflowY="scroll"
      paddingBottom="1rem"
      paddingTop="1rem"
      style={{ opacity: settingsMode ? 0 : 1 }}
      width="100%"
    >
      {turns.map(
        (turn, i) => turn && (
          <Box
            key={turn.timestamp || `turn_${i}`}
            alignItems="flex-end"
            display="flex"
            justifyContent={turn.role === 'user' ? 'flex-start' : 'flex-end'}
            mb={0}
            mt={3}
            width="100%"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            {turn.role === 'assistant' && (
              <Box display="flex" flexDirection="column" gap={0} mr={0}>
                <IconButton
                  aria-label="Copy"
                  as={motion.div}
                  borderRadius={16}
                  icon={<FiCopy color="var(--text)" fontSize="1.5rem" />}
                  opacity={hoveredIndex === i ? 1 : 0}
                  transition="opacity 0.2s"
                  variant="outlined"
                  whileHover={{ scale: 1.1, cursor: 'pointer' }}
                  onClick={() => copyMessage(turn.rawContent)}
                />
                <IconButton
                  aria-label="Speak"
                  as={motion.div}
                  borderRadius={16}
                  icon={<SlVolume2 color="var(--text)" fontSize="1.5rem" />}
                  onClick={() => speakMessage(turn.rawContent)}
                  opacity={hoveredIndex === i ? 1 : 0}
                  transition="opacity 0.2s"
                  variant="outlined"
                  whileHover={{ scale: 1.1, cursor: 'pointer' }}
                />
                {i === turns.length - 1 && (
                  <IconButton
                    aria-label="Repeat"
                    as={motion.div}
                    borderRadius={16}
                    icon={<FiRepeat color="var(--text)" fontSize="1.5rem" />}
                    opacity={hoveredIndex === i ? 1 : 0}
                    transition="opacity 0.2s"
                    variant="outlined"
                    whileHover={{ rotate: '90deg', cursor: 'pointer' }}
                    onClick={onReload}
                  />
                )}
              </Box>
            )}
            <Message turn={turn} index={i} />
            {turn.role === 'user' && (
              <Box display="flex" flexDirection="column" gap={0} ml={0}>
                <IconButton
                  aria-label="Copy"
                  as={motion.div}
                  borderRadius={16}
                  icon={<FiCopy color="var(--text)" fontSize="1.5rem" />}
                  opacity={hoveredIndex === i ? 1 : 0}
                  transition="opacity 0.2s"
                  variant="outlined"
                  whileHover={{ scale: 1.1, cursor: 'pointer' }}
                  onClick={() => copyMessage(turn.rawContent)}
                />
              </Box>
            )}
          </Box>
        )
      )}
    </Box>
  );
};

