import React, {
 ForwardedRef, useEffect, useRef 
} from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { Box, Textarea } from '@chakra-ui/react';

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

export const Input = ({ ...props }) => {
  const { config } = useConfig();
  const ref = useRef(null);

  useEffect(() => {
    // @ts-expect-error ref can be null
    ref?.current?.focus();
  }, [props.message, config?.chatMode]);

  const placeholder = config?.chatMode === 'web' ? 'what to search?' : config?.chatMode === 'page' ? 'about the page..' : '';

  return (
    <Box ml={2} position="relative" width="100%">
      <Box
        position="absolute"
      />
      <AutoResizeTextarea
        {...props}
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
        value={props.message}
        width="100%"
        zIndex={1}
        autoFocus
        p={1}
        onChange={event => props.setMessage(event.target.value)}
        onKeyDown={event => {
          if (props.isLoading) return;

          if (event.keyCode === 13 && props.message && !event.altKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            props.onSend();
            props.setMessage('');
          }
        }}
      />
    </Box>
  );
};
