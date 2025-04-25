import { FiPaperclip } from 'react-icons/fi';
import {
  Button, Menu, MenuButton, MenuItem, MenuList, Center
} from '@chakra-ui/react';

import { useConfig } from './ConfigContext';

export const AddToChat = () => {
  const { config, updateConfig } = useConfig();

  return (
    <Menu>
      <MenuButton
        aria-label="Add to chat"
        as={Button}
        background="var(--bg)"
        border="2px solid var(--text)"
        borderRadius={16}
        color="var(--text)"
        fontSize="sm"
        fontWeight={800}
        m={0}
        ml={2}
        size="md"
        variant="outlined"
        zIndex={2}
        p={0}
        height="2rem"
        minWidth="auto" // Allow button to shrink if needed
      >
        <Center px={2}> {/* Added padding here for better spacing */}
          {!config?.chatMode && (
            <FiPaperclip color="var(--text)" fontSize="1.25rem" style={{ marginRight: config?.chatMode ? '0.5rem' : 0 }} />
          )}
          {/* Conditionally render chatMode text */}
          {config?.chatMode && config.chatMode.charAt(0).toUpperCase() + config.chatMode.slice(1)}
        </Center>
      </MenuButton>
      <MenuList
        background="var(--active)"
        border="2px solid var(--text)" // Apply border once here
        borderRadius="md" // Optional: add some rounding
        marginTop="1px"
        minWidth="80px" // Adjusted minWidth
        p={0} // Remove padding from MenuList itself
        overflow="hidden" // Ensure border radius clips children
        zIndex={4}
      >
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={!config?.chatMode ? 'var(--bg)' : 'transparent'} // Use transparent for non-active
          borderBottom="2px solid var(--text)" // Remove individual borders
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: undefined })}
          display="flex" // Add display flex
          justifyContent="center" // Add justify content center
          py={2} // Add vertical padding
        >
          Chat
        </MenuItem>
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={config?.chatMode === 'page' ? 'var(--bg)' : 'transparent'}
          borderBottom="2px solid var(--text)"
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: 'page' })}
          display="flex" // Add display flex
          justifyContent="center" // Add justify content center
          py={2} // Add vertical padding
        >
          Page
        </MenuItem>
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={config?.chatMode === 'web' ? 'var(--bg)' : 'transparent'}
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: 'web' })}
          display="flex" // Add display flex
          justifyContent="center" // Add justify content center
          py={2} // Add vertical padding
        >
          Web
        </MenuItem>
      </MenuList>
    </Menu>
  );
};
