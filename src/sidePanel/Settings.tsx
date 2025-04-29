// src/sidePanel/Settings.tsx
import { Accordion, Box } from '@chakra-ui/react';
import React from 'react'; // Import React for useEffect

import { Automation } from './Automation';
import { useConfig } from './ConfigContext';
import { Connect } from './Connect';
import { PageContext } from './PageContext';
import { Params } from './Params';
import { Persona } from './Persona';
import { themes, setTheme, Themes } from './Themes'; // Import themes and setTheme
import { TtsSettings } from './TtsSettings';
import { WebSearch } from './WebSearch';


export const Settings = () => {
  const { config } = useConfig();
  const defaultIndex = (config?.models || [])?.length === 0 ? 1 : undefined;
  const isDark = config?.theme === 'dark';

  // Define control styles (can be adjusted or moved to theme variables if preferred)
  const controlBg = isDark
    ? 'rgba(255, 255, 255, 0.04)'
    : 'rgba(255, 250, 240, 0.6)';
  const controlFilter = 'brightness(1.02) contrast(0.98)';
  const subtleBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const floatingShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  const hoverFilter = `${controlFilter} brightness(0.98)`;

  return (
    <Box
      id="settings"
      position="absolute"
      top={0}
      width="100%"
      height="100%" // Ensure it covers the full height
      display="flex"
      flexDir="column"
      overflowY="scroll" // Allow scrolling for content
      overflowX="hidden" // Use conditional background
      bg="var(--bg)" // Set base background
      color="var(--text)"
      // Apply texture and consistent padding like the drawer
      px="1.5rem" // Horizontal padding like the drawer's VStack
      pt="56px" // Keep padding-top to account for the fixed Header height
      pb={4} // Bottom padding
      sx={{
        position: 'relative', // Still needed for z-index stacking context
        // Texture is now applied globally via CSS in index.html targeting #settings
        // Ensure direct children are above the texture
        '> *': { position: 'relative', zIndex: 1 },
      }}
    >
      {/* Accordion container */}
      <Accordion
        defaultIndex={defaultIndex}
        // Removed marginTop, maxWidth, ml, mr - handled by parent Box padding
        width="100%" // Take full width within the padded Box
        allowToggle
        reduceMotion
        // Apply styling consistent with drawer controls to Accordion items
        sx={{
          '.chakra-accordion__item': {
            border: 'none', // Remove default accordion item borders
            borderRadius: 'xl', // Make rounder
            boxShadow: floatingShadow,
            bg: controlBg,
            // filter: controlFilter, // Remove filter to avoid creating stacking context
            borderColor: subtleBorderColor,
            borderWidth: '1px',
            // overflow: 'hidden', // Temporarily remove to test panel height
            mb: 4, // Add margin between accordion items
            _last: { mb: 0 } // No margin for the last item
          },
          '.chakra-accordion__button': {
             bg: controlBg, // Button itself use same background as item.
             color: 'var(--text)',
             fontWeight: 'medium', // Match drawer button weight
             fontSize: 'lg', // Match drawer button size (adjust if needed)
             py: 2, // Make shorter (less vertical padding)
             px: 4, // Horizontal padding for button
             borderColor: subtleBorderColor,
             borderWidth: '1px',
             _hover: {
               // Use a subtle hover effect, maybe adjust brightness slightly
               filter: hoverFilter,
               borderColor: 'var(--active)',
               bg: controlBg, // Keep control background on hover
             },
             _focus: {
                boxShadow: 'none', // Remove default focus ring if desired
             },
             // Ensure title (SettingTitle) aligns correctly
             '> div': { // Target the inner div holding the title/widget
                width: '100%',
             }
          },
          '.chakra-accordion__panel': {
            pt: 0, // Remove default top padding
            pb: 4, // Panel bottom padding
            px: 4, // Panel horizontal padding
            bg: 'transparent', // Panel itself is transparent
          },
          '.chakra-accordion__icon': {
             color: 'var(--text)', // Style the expand/collapse icon
             ml: 2,
          }
        }}
      >
        {/* Render Accordion Items */}
        <Themes />
        <Connect />
        <Persona />
        <TtsSettings />
        <PageContext />
        <WebSearch />
        <Params />
        <Automation />
      </Accordion>
    </Box>
  );
};
