import { IconButton, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi'; // Paper plane icon from react-icons

export const Send = ({ isLoading, onSend }: { isLoading: boolean, onSend: () => void }) => (
  <IconButton
    aria-label="Send"
    as={motion.div}
    background="var(--bg)"
    border="2px solid var(--text)"
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
    size="md"
    variant="outlined"
    whileHover={{ transform: !isLoading ? 'translateX(2px)' : undefined }}
    zIndex={2}
    onClick={onSend}
    pb={0}
    pt={0}
    height="2rem"
    isDisabled={isLoading}
  />
);
