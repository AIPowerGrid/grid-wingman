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
      >
        <Center>
          {!config?.chatMode && (
            <FiPaperclip color="var(--text)" fontSize="1.25rem" style={{ marginRight: 0 }} />
          )}
          {config?.chatMode}
        </Center>
      </MenuButton>
      <MenuList
        background="var(--active)"
        borderBottom="2px solid var(--text)"
        borderLeft="2px solid var(--text)"
        borderRight="2px solid var(--text)"
        borderTop="2px solid var(--text)"
        marginTop="1px"
        minWidth="110px"
        p={0}
        style={{
          right: '-5.1rem', bottom: '0rem', position: 'absolute' 
        }}
        zIndex={4}
      >
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={!config?.chatMode ? 'var(--bg)' : 'var(--bg)'}
          borderBottom="2px solid var(--text)"
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: undefined })}
        >
          Chat
        </MenuItem>
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={config?.chatMode === 'page' ? 'var(--bg)' : 'var(--bg)'}
          borderBottom="2px solid var(--text)"
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: 'page' })}
        >
          Page
        </MenuItem>
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={config?.chatMode === 'web' ? 'var(--bg)' : 'var(--bg)'}
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: 'web' })}
        >
          Web
        </MenuItem>
      </MenuList>
    </Menu>
  );
};
