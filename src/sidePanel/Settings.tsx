// src/sidePanel/Settings.tsx
import { Accordion, Box } from '@chakra-ui/react';

import { Automation } from './Automation';
import { useConfig } from './ConfigContext';
import { Connect } from './Connect';
import { PageContext } from './PageContext';
import { Params } from './Params';
import { Persona } from './Persona';
import { Themes } from './Themes';
import { TtsSettings } from './TtsSettings'; // <-- Import the new component
import { WebSearch } from './WebSearch';


export const Settings = () => {
  const { config } = useConfig();
  const defaultIndex = (config?.models || [])?.length === 0 ? 1 : undefined;

  return (
    <Box
      alignItems="center"
      display="flex"
      flexDir="column"
      flexGrow={1}
      height="100%"
      id="settings"
      overflowX="hidden"
      overflowY="scroll"
      padding={1}
      position="absolute"
      pt="4rem"
      top={0}
      width="100%"
    >
      <Accordion
        defaultIndex={defaultIndex}
        marginTop={2}
        maxWidth="512px"
        ml={2}
        mr={2}
        width="100%"
        allowToggle
        reduceMotion
      >
        <Themes />
        <Connect />
        <Persona />
        <TtsSettings /> {/* <-- Add the TTS settings section here */}
        <PageContext />
        <WebSearch />
        <Params />
        <Automation />
      </Accordion>
    </Box>
  );
};
