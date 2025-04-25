import { useEffect, useState, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
  Box,
  Container,
  Tooltip,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import localforage from 'localforage';
import { TbWorldSearch, TbBrowserPlus } from "react-icons/tb"; // <-- Import icons

import { useChatTitle } from './hooks/useChatTitle';
import useSendMessage from './hooks/useSendMessage';
import { useUpdateModels } from './hooks/useUpdateModels';
import { AddToChat } from './AddToChat';
import { Background } from './Background';
import { ChatHistory, ChatMessage, MessageTurn } from './ChatHistory'; 
import { useConfig } from './ConfigContext';
import { Header } from './Header';
import { Input } from './Input';
import { Messages } from './Messages';
import {
 downloadImage, downloadJson, downloadText 
} from './messageUtils';
import { Send } from './Send';
import { Settings } from './Settings';
import storage from '../util/storageUtil';

function bridge() {
  // Collect image alt texts
  const altTexts = Array.from(document.images)
    .map(img => img.alt)
    .filter(alt => alt.trim().length > 0)
    .join('. ');

  // Extract table contents
  const tableData = Array.from(document.querySelectorAll('table'))
    .map(table => table.innerText.replace(/\s\s+/g, ' '))
    .join('\n');

  const response = JSON.stringify({
    title: document.title,
    text: document.body.innerText.replace(/\s\s+/g, ' '),
    html: document.body.innerHTML.replace(/\s\s+/g, ' '),
    
    // New fields
    altTexts,
    tableData,
    meta: {
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')
    }
  });

  return response;
}

// Modify the injectBridge function
async function injectBridge() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  
  // Add early return for restricted URLs
  if (!tab?.id || tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    console.debug('Skipping injection for restricted URL:', tab?.url);

    return;
  }

  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: bridge
    });
    const res = JSON.parse(result?.[0]?.result || '{}');

    try {
      storage.setItem('pagestring', res?.text || ''); // Raw string, no JSON.stringify
      storage.setItem('pagehtml', res?.html || '');
      storage.setItem('alttexts', res?.altTexts || '');
      storage.setItem('tabledata', res?.tableData || '');
    } catch (err) {
      console.debug('storage error:', err);
    }
  } catch (err) {
    console.debug('Script injection failed:', err);
  }
}

const generateChatId = () => `chat_${Math.random().toString(16).slice(2)}`;
 
const MessageTemplate = ({ children, onClick }) => (
  <Box
    background="var(--active)"
    border="2px solid var(--text)"
    borderRadius={16}
    color="var(--text)"
    cursor="pointer"
    display="flex"
    alignItems="center"
    justifyContent="center"
    fontSize="md"
    fontWeight={800}
    p={1}
    placeItems="center"
    position="relative"
    textAlign={'center'}
    width="4rem"
    onClick={onClick}
    flexShrink={0}
  >
    {children}
  </Box>
);

const Cognito = () => {
  const [turns, setTurns] = useState<MessageTurn[]>([]);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(generateChatId());
  const [webContent, setWebContent] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const { config, updateConfig } = useConfig();
  const [currentTabInfo, setCurrentTabInfo] = useState<{ id: number | null, url: string }>({ id: null, url: '' });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        // Force layout recalculation
        containerRef.current.style.minHeight = '100dvh';
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.minHeight = '';
          }
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (config?.chatMode !== 'page') return;

    // Function to check and inject if needed
    const checkAndInject = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      
      // Only inject if tab or URL changed
      if (tab?.id && tab.url && (tab.id !== currentTabInfo.id || tab.url !== currentTabInfo.url)) {
        setCurrentTabInfo({ id: tab.id, url: tab.url });
        await injectBridge();
      }
    };

    // Initial check
    checkAndInject();

    // Set up tab change listeners
    const handleTabActivated = ({ tabId }) => {  
      // Use tabId from activeInfo instead of querying again  
      chrome.tabs.get(tabId, (tab) => {  
        if (tab?.url) checkAndInject();  
      });  
    };  

    const handleTabUpdated = (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' || changeInfo.url) {
        checkAndInject();
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    // Cleanup listeners
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [config?.chatMode]); // Only re-run if chatMode changes

  const { chatTitle, setChatTitle } = useChatTitle(isLoading, turns, message);

  const onSend = useSendMessage(isLoading, message, turns, webContent, config, setTurns, setMessage, setWebContent, setPageContent, setLoading);

  useUpdateModels();

  const reset = () => {
    setTurns([]);
    setPageContent('');
    setWebContent('');
    setLoading(false);
    updateConfig({ chatMode: undefined });
    setMessage('');
    setChatTitle('');
    setChatId(generateChatId());
    setHistoryMode(false); // Add this
  };

  const onReload = () => {
    setTurns(prevTurns => {
      if (prevTurns.length < 2) return prevTurns;
      const last = prevTurns[prevTurns.length - 1];
      const secondLast = prevTurns[prevTurns.length - 2];
      // Only proceed if last is assistant and second last is user
      if (last.role === 'assistant' && secondLast.role === 'user') {
        // Remove both last assistant and user turn
        setMessage(secondLast.rawContent); // Move user message back to input
        return prevTurns.slice(0, -2);
      }
      return prevTurns;
    });
    setLoading(false);
  };

  const loadChat = (chat: ChatMessage) => {
    setChatTitle(chat.title || '');
    setTurns(chat.turns);
    setChatId(chat.id);
    setHistoryMode(false);
  };

  useEffect(() => {
    if (turns.length && !isLoading) {
      const savedChat: ChatMessage = {
        id: chatId,
        title: chatTitle,
        turns, // Already contains proper role info
        last_updated: Date.now(),
        model: config?.selectedModel
      };
      console.log(`[${Date.now()}] Cognito: Saving chat ${chatId}`, savedChat); // Debug log

      localforage.setItem(chatId, savedChat);
    }
  }, [chatId, turns, isLoading, chatTitle, config?.selectedModel]);

  const deleteAll = async () => {
    const keys = await localforage.keys();
    await Promise.all(keys.map(key => localforage.removeItem(key)));
    setTurns([]);
    setPageContent('');
    setWebContent('');
    setLoading(false);
    setMessage('');
    setChatTitle('');
    setChatId(generateChatId());
    setHistoryMode(false); // Add this line to exit history mode
    updateConfig({ chatMode: undefined }); // Add this line to reset chat mode
  };

// Add reset() call inside handlePanelOpen when component mounts
useEffect(() => {
  const handlePanelOpen = async () => {
    reset(); // Reset state every time the panel opens
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (tab?.id) {
      await injectBridge();
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
    }
  };

  handlePanelOpen();
  
  return () => {
    // Clear cached content and reset states when panel closes
    storage.deleteItem('pagestring');
    storage.deleteItem('pagehtml');
    storage.deleteItem('alttexts');
    storage.deleteItem('tabledata');
    reset(); // Reset state on component unmount
  };
}, []);
// Inside your component:
const [isHovering, setIsHovering] = useState(false);

  return (
    <Container
      ref={containerRef}
      maxWidth="100%"
      minHeight="100dvh" // Use dynamic viewport height
      padding={0}
      position="relative" // Ensure proper stacking context
      overflow="hidden" // Prevent layout shifts
      display="flex"
      flexDirection="column"
    >
      <Box
        display="flex"
        flexDir="column"
        justifyContent="space-between"
        minHeight="100vh"
      >
        <Header
          chatTitle={chatTitle}
          deleteAll={deleteAll}  // Pass the local deleteAll function
          downloadImage={() => downloadImage(turns)}
          downloadJson={() => downloadJson(turns)}
          downloadText={() => downloadText(turns)}
          historyMode={historyMode}
          reset={reset}
          setHistoryMode={setHistoryMode}
          setSettingsMode={setSettingsMode}
          settingsMode={settingsMode}
        />
        {settingsMode && <Settings />}
        <Box display="flex" flexDir="column" flex="1 1 0%" minHeight={0}>
          {!settingsMode && !historyMode && turns.length > 0 && (
            <Messages
              isLoading={isLoading}
              turns={turns}
              settingsMode={settingsMode}
              onReload={onReload}
            />
          )}
          {!settingsMode && !historyMode && turns.length === 0 && !config?.chatMode && (
            // Adjust positioning and layout if needed for icons
            <Box bottom="3rem" left="1rem" position="absolute" display="flex" flexDirection="column" gap={2}>
              <Tooltip label="Add Web Search Results to LLM Context" placement="right" hasArrow>
                {/* Use IconButton */}
                <IconButton
                  aria-label="Add Web Search Results to LLM Context" // Important for accessibility
                  icon={<TbWorldSearch size="24px" />} // Pass icon component to 'icon' prop
                  onClick={() => {
                    updateConfig({ chatMode: 'web' });
                  }}
                  variant="ghost" // Use 'ghost' for minimal styling, or 'unstyled'
                  size="md"      // Adjust size: 'sm', 'md', 'lg'
                  color="var(--text)" // Ensure icon color matches
                  // isRound // Optional: makes the button circular
                  _hover={{ bg: 'rgba(128, 128, 128, 0.2)' }} // Optional: subtle hover effect
                />
              </Tooltip>
              <Tooltip label="Add Current Web Page to LLM Context" placement="right" hasArrow>
                {/* Use IconButton */}
                <IconButton
                  aria-label="Add Current Web Page to LLM Context"
                  icon={<TbBrowserPlus size="24px" />}
                  onClick={() => {
                    updateConfig({ chatMode: 'page' });
                  }}
                  variant="ghost"
                  size="md"
                  color="var(--text)"
                  // isRound
                  _hover={{ bg: 'rgba(128, 128, 128, 0.2)' }}
                />
              </Tooltip>
            </Box>
          )}
          {!settingsMode && !historyMode && config?.chatMode === "page" && (
            <Box 
              bottom="3rem"
              left="1rem"
              right="1rem"
              position="fixed" 
              display="flex" 
              flexDirection="row"
              justifyContent="center"
              maxWidth="100%"
              height="2.4rem"
              zIndex={2}
              opacity={isHovering ? 1 : 0} // Fade in/out
              transform={isHovering ? "translateY(0)" : "translateY(10px)"} // Slide up/down
              transition="all 0.2s ease-in-out" // Smooth animation
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              sx={{
                background: 'transparent',
                padding: '0rem',
                backdropFilter: 'blur(10px)',
              }}
            >
             <HStack spacing={4} maxW="100%" overflowX="auto" px={2}> {/* Added padding */}
              <MessageTemplate onClick={() => onSend('Provide a concise overview of this page.')}>
                TLDR
              </MessageTemplate>
              <MessageTemplate onClick={() => onSend('Extract all key figures, names, locations, and dates mentioned on this page and list them.')}>
                Facts
              </MessageTemplate>
              <MessageTemplate onClick={() => onSend('Find positive developments, achievements, or opportunities mentioned on this page.')}>
                Yay!
              </MessageTemplate>
              <MessageTemplate onClick={() => onSend('Find concerning issues, risks, or criticisms mentioned on this page.')}>
                Oops
              </MessageTemplate>
             </HStack>
            </Box>
          )}
        </Box>
        {!settingsMode && !historyMode && (
          <Box
            background="var(--active)"
            borderTop="2px solid var(--text)"
            display="flex"
            justifyContent="space-between"
            pb={1}
            position="relative"  // Add this
            pt={1}
            style={{ opacity: settingsMode ? 0 : 1 }}
            zIndex={2}
          >
            <Input p={0} isLoading={isLoading} message={message} setMessage={setMessage} onSend={onSend} />
            <AddToChat />
            <Send isLoading={isLoading} onSend={() => onSend(message)} />
          </Box>
        )}
        {historyMode && (
          <ChatHistory 
            loadChat={loadChat} 
            onDeleteAll={deleteAll}  // Change this line to use the main deleteAll function
          />
        )}
        {config?.backgroundImage ? <Background /> : null}
      </Box>
      <Toaster
        containerStyle={{
          borderRadius: 16
        }}
        toastOptions={{
          duration: 2000,
          position: "bottom-center",
          style: {
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: "1.25rem"
          },

          // Default options for specific types
          success: {
            duration: 2000,
            style: {
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: "1.25rem"
            }
          }
        }} />
    </Container>
  );
};

export default Cognito;
