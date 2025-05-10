import { useEffect, useState, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
// Removed Chakra UI imports: Box, Container, Tooltip, IconButton, HStack
import localforage from 'localforage';
import { TbWorldSearch, TbBrowserPlus } from "react-icons/tb"; // Keep icons
import { BiBrain } from "react-icons/bi"; // Keep icons

// Shadcn/ui imports
import { Button } from "@/components/ui/button"; // Shadcn Button
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Shadcn Tooltip
import { cn } from "@/src/background/util"; // Utility for conditional classes

// Keep existing custom component imports
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
} from '../background/messageUtils';
import { Send } from './Send';
import { Settings } from './Settings';
import storage from '../background/storageUtil';

function bridge() {
    // --- Safety Measure 1: Basic DOM readiness check (optional, usually not an issue for content scripts) ---
    // if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    //     console.warn('[Cognito Bridge] DOM not fully ready. Content might be incomplete.');
    //     // You could return an error or empty data here if critical
    // }

    let title = '';
    let textContent = '';
    let htmlContent = '';
    let altTexts = '';
    let tableData = '';
    let metaDescription = '';
    let metaKeywords = '';

    try {
        title = document.title || '';

        // --- Safety Measure 2: Limit the scope for innerText/innerHTML if body is enormous ---
        // This is a heuristic. You might need to adjust MAX_CHARS or disable.
        const MAX_BODY_CHARS_FOR_DIRECT_EXTRACTION = 5_000_000; // Approx 5MB of text
        let bodyElement = document.body;

        if (document.body && document.body.innerHTML.length > MAX_BODY_CHARS_FOR_DIRECT_EXTRACTION) {
            console.warn(`[Cognito Bridge] Document body is very large (${document.body.innerHTML.length} chars). Attempting to use a cloned, simplified version for text extraction to improve performance/stability.`);

            // Fallback to a light clone and minimal cleaning for very large pages
            // This is a compromise: might lose some formatting innerText would preserve,
            // but aims for stability.
            const clonedBody = document.body.cloneNode(true) as HTMLElement;
            clonedBody.querySelectorAll('script, style, noscript, iframe, embed, object').forEach(el => el.remove());
            textContent = (clonedBody.textContent || '').replace(/\s\s+/g, ' ').trim();
            // For HTML, you might still want the original or decide to send the cleaned one
            htmlContent = document.body.innerHTML.replace(/\s\s+/g, ' '); // Or clonedBody.innerHTML
            // Or, if even clonedBody.innerHTML is too big, send a truncated version or placeholder
            // if (htmlContent.length > MAX_BODY_CHARS_FOR_DIRECT_EXTRACTION * 1.5) { // HTML can be larger
            //    htmlContent = `HTML content too large (length: ${htmlContent.length}). Truncated.`;
            // }

        } else if (document.body) {
            textContent = (document.body.innerText || '').replace(/\s\s+/g, ' ').trim();
            htmlContent = (document.body.innerHTML || '').replace(/\s\s+/g, ' ');
        } else {
            console.warn('[Cognito Bridge] document.body is not available.');
        }


        // --- Alt Texts and Table Data (generally safe as is) ---
        altTexts = Array.from(document.images)
            .map(img => img.alt)
            .filter(alt => alt && alt.trim().length > 0)
            .join('. ');

        tableData = Array.from(document.querySelectorAll('table'))
            .map(table => (table.innerText || '').replace(/\s\s+/g, ' '))
            .join('\n');

        // --- Meta Tags (generally safe as is) ---
        const descElement = document.querySelector('meta[name="description"]');
        metaDescription = descElement ? descElement.getAttribute('content') || '' : '';

        const keywordsElement = document.querySelector('meta[name="keywords"]');
        metaKeywords = keywordsElement ? keywordsElement.getAttribute('content') || '' : '';

    } catch (error) {
        console.error('[Cognito Bridge] Error during content extraction:', error);
        // Return a structured error or partial data if possible
        return JSON.stringify({
            error: `Extraction failed: ${error.message}`,
            title: document.title || 'Error extracting title', // Try to get title anyway
            text: '', html: '', altTexts: '', tableData: '',
            meta: { description: '', keywords: '' }
        });
    }

    // --- Safety Measure 3: Truncate extremely long outputs before stringifying ---
    // This protects the extension storage and IPC messages if something goes unexpectedly huge.
    const MAX_OUTPUT_STRING_LENGTH = 10_000_000; // 10MB for the whole JSON string
    
    let responseCandidate = {
        title,
        text: textContent,
        html: htmlContent,
        altTexts,
        tableData,
        meta: {
            description: metaDescription,
            keywords: metaKeywords
        }
    };

    // Simple truncation strategy: prioritize text, then HTML, then others.
    // A more sophisticated strategy might be needed for extreme cases.
    if (JSON.stringify(responseCandidate).length > MAX_OUTPUT_STRING_LENGTH) {
        console.warn('[Cognito Bridge] Total extracted content is very large. Attempting to truncate.');
        const availableLength = MAX_OUTPUT_STRING_LENGTH - JSON.stringify({ ...responseCandidate, text: "", html: "" }).length;
        let remainingLength = availableLength;

        if (responseCandidate.text.length > remainingLength * 0.6) { // Prioritize text
            responseCandidate.text = responseCandidate.text.substring(0, Math.floor(remainingLength * 0.6)) + "... (truncated)";
        }
        remainingLength = availableLength - responseCandidate.text.length;

        if (responseCandidate.html.length > remainingLength * 0.8) { // Then HTML
             responseCandidate.html = responseCandidate.html.substring(0, Math.floor(remainingLength * 0.8)) + "... (truncated)";
        }
        // Could add more truncation for altTexts, tableData if still too large
        console.warn('[Cognito Bridge] Content truncated. Final approx length:', JSON.stringify(responseCandidate).length);
    }


    return JSON.stringify(responseCandidate);
}

async function injectBridge() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);

  // Add early return for restricted URLs
  if (!tab?.id || tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('about:')) { // Added about:
    console.debug('[Cognito:] Skipping injection for restricted URL:', tab?.url);
    // Clear storage if activating/navigating to a restricted tab
    storage.deleteItem('pagestring');
    storage.deleteItem('pagehtml');
    storage.deleteItem('alttexts');
    storage.deleteItem('tabledata');
    return;
  }

  console.debug(`[Cognito:] Attempting injection into tab ${tab.id} (${tab.url})`);

  // Clear storage before injection attempt
  storage.deleteItem('pagestring');
  storage.deleteItem('pagehtml');
  storage.deleteItem('alttexts');
  storage.deleteItem('tabledata');
  console.debug('[Cognito:] Cleared previous page content from storage.');

  try {
    console.debug('[Cognito:] Executing bridge function...');
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: bridge
    });

    // Basic result checking
    if (!results || !Array.isArray(results) || results.length === 0 || !results[0] || typeof results[0].result !== 'string') {
        console.error('[Cognito:] Bridge function execution returned invalid or unexpected results structure:', results);
        // No toast here in the reverted version, just log
        return;
    }

    const rawResult = results[0].result;
    let res: any; // Use 'any' for simplicity in reverted version or define a simple interface
    try {
        res = JSON.parse(rawResult);
    } catch (parseError) {
        console.error('[Cognito:] Failed to parse JSON result from bridge:', parseError, 'Raw result string:', rawResult);
        return;
    }

    // Check for error field from bridge (added basic error handling)
    if (res.error) {
        console.error('[Cognito:] Bridge function reported an error:', res.error, 'Title:', res.title);
        return;
    }

    console.debug('[Cognito:] Bridge function parsed result:', { // Log subset
        title: res?.title,
        textLength: res?.text?.length,
        htmlLength: res?.html?.length
    });
    console.log(`[Cognito:] Extracted Content: Text=${res?.text?.length}, HTML=${res?.html?.length}`);


    // Store the extracted content (reverted version)
    try {
      storage.setItem('pagestring', res?.text ?? ''); // Use nullish coalescing
      storage.setItem('pagehtml', res?.html ?? '');
      storage.setItem('alttexts', res?.altTexts ?? '');
      storage.setItem('tabledata', res?.tableData ?? '');
      console.debug('[Cognito:] Stored extracted content.');
    } catch (storageError) {
        console.error('[Cognito:] Storage error after successful extraction:', storageError);
        // Attempt to clear storage again on error
        storage.deleteItem('pagestring');
        storage.deleteItem('pagehtml');
        storage.deleteItem('alttexts');
        storage.deleteItem('tabledata');
    }
  } catch (execError) {
    console.error('[Cognito:] Bridge function execution failed:', execError);
    // Log specific errors if needed, but avoid user-facing toasts in reverted version
    if (execError instanceof Error && (execError.message.includes('Cannot access contents of url "chrome://') || execError.message.includes('Cannot access a chrome extension URL') || execError.message.includes('Cannot access contents of url "about:'))) {
        console.warn('[Cognito:] Cannot access restricted URL.');
    }
    // Storage should have been cleared before the try block
  }
}


const generateChatId = () => `chat_${Math.random().toString(16).slice(2)}`;

// --- MessageTemplate Component (Migrated) ---
const MessageTemplate = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
  // Replace Box with div and Tailwind classes
  (<div
    className={cn(
      "bg-[var(--active)] border border-[var(--text)] rounded-[16px] text-[var(--text)]", // background, border, borderRadius, color
      "cursor-pointer flex items-center justify-center", // cursor, display, alignItems, justifyContent
      "text-md font-extrabold p-0.5 place-items-center relative text-center", // fontSize, fontWeight, p, placeItems, position, textAlign
      "w-16 flex-shrink-0", // width="4rem", flexShrink=0
      "transition-colors duration-200 ease-in-out", // transition
      "hover:bg-[rgba(var(--text-rgb),0.1)]" // _hover.background
    )}
    onClick={onClick} // Keep onClick
  >
    {children}
  </div>)
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
  const lastInjectedRef = useRef<{ id: number | null, url: string }>({ id: null, url: '' });

  // Resize observer remains the same
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        containerRef.current.style.minHeight = '100dvh'; // Use 100dvh
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.minHeight = '';
          }
        });
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Tab management useEffect remains the same (no Chakra UI)
  useEffect(() => {
    if (config?.chatMode !== 'page') return;

    const checkAndInject = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab?.id || !tab.url) return;

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
          console.log(`[Cognito ] Active tab is restricted (${tab.url}). Skipping injection.`);
          if (lastInjectedRef.current.id !== tab.id || lastInjectedRef.current.url !== tab.url) {
              storage.deleteItem('pagestring');
              storage.deleteItem('pagehtml');
              storage.deleteItem('alttexts');
              storage.deleteItem('tabledata');
              console.log("[Cognito ] Cleared storage due to restricted tab activation/update.");
          }
          lastInjectedRef.current = { id: tab.id, url: tab.url };
          setCurrentTabInfo({ id: tab.id, url: tab.url });
          return;
      }

      if (tab.id !== lastInjectedRef.current.id || tab.url !== lastInjectedRef.current.url) {
        console.log(`[Cognito ] Tab changed or updated. Old: ${lastInjectedRef.current.id}/${lastInjectedRef.current.url}, New: ${tab.id}/${tab.url}. Re-injecting bridge.`);
        lastInjectedRef.current = { id: tab.id, url: tab.url };
        setCurrentTabInfo({ id: tab.id, url: tab.url });
        await injectBridge();
      } else {
        console.log(`[Cognito ] Tab activated/updated, but ID and URL match last injection. Skipping bridge injection.`);
      }
    };

    checkAndInject();

    const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      console.log(`[Cognito ] Tab activated: tabId ${activeInfo.tabId}`);
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) {
          console.warn(`[Cognito ] Error getting tab info on activation: ${chrome.runtime.lastError.message}`);
          return;
        }
        checkAndInject();
      });
    };

    const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (tab.active && (changeInfo.status === 'complete' || (changeInfo.url && tab.status === 'complete'))) {
         console.log(`[Cognito ] Active tab updated: tabId ${tabId}, status: ${changeInfo.status}, url changed: ${!!changeInfo.url}`);
         checkAndInject();
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    return () => {
      console.log("[Cognito ] Cleaning up tab listeners for 'page' mode.");
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      lastInjectedRef.current = { id: null, url: '' };
    };
  }, [config?.chatMode]);

  const { chatTitle, setChatTitle } = useChatTitle(isLoading, turns, message);
  const onSend = useSendMessage(isLoading, message, turns, webContent, config, setTurns, setMessage, setWebContent, setPageContent, setLoading);
  useUpdateModels();

  // reset, onReload, loadChat, deleteAll functions remain the same (no Chakra UI)
  const reset = () => {
    console.log("[Cognito ] Resetting chat state.");
    setTurns([]);
    setPageContent('');
    setWebContent('');
    setLoading(false);
    updateConfig({ chatMode: undefined, computeLevel: 'low' });
    setMessage('');
    setChatTitle('');
    setChatId(generateChatId());
    setHistoryMode(false);
    setSettingsMode(false);
  };

  const onReload = () => {
    setTurns(prevTurns => {
      if (prevTurns.length < 2) return prevTurns;
      const last = prevTurns[prevTurns.length - 1];
      const secondLast = prevTurns[prevTurns.length - 2];
      if (last.role === 'assistant' && secondLast.role === 'user') {
        console.log("[Cognito ] Reloading last user message.");
        setMessage(secondLast.rawContent);
        return prevTurns.slice(0, -2);
      }
      console.log("[Cognito ] Cannot reload, conditions not met.");
      return prevTurns;
    });
    setLoading(false);
  };

  const loadChat = (chat: ChatMessage) => {
    console.log(`[Cognito ] Loading chat ${chat.id}`);
    setChatTitle(chat.title || '');
    setTurns(chat.turns);
    setChatId(chat.id);
    setHistoryMode(false);
    setSettingsMode(false);
    updateConfig({ chatMode: undefined });
    storage.deleteItem('pagestring');
    storage.deleteItem('pagehtml');
    storage.deleteItem('alttexts');
    storage.deleteItem('tabledata');
    lastInjectedRef.current = { id: null, url: '' };
  };

  const deleteAll = async () => {
    console.log("[Cognito ] Deleting all chat history from localforage.");
    try {
        const keys = await localforage.keys();
        const chatKeys = keys.filter(key => key.startsWith('chat_'));
        await Promise.all(chatKeys.map(key => localforage.removeItem(key)));
        toast.success("Deleted all chats");
        reset();
    } catch (error) {
        console.error("[Cognito] Error deleting all chats:", error);
        toast.error("Failed to delete chats");
    }
  };

  // Chat saving useEffect remains the same (no Chakra UI)
  useEffect(() => {
    if (turns.length > 0 && !isLoading && !historyMode && !settingsMode) {
      const savedChat: ChatMessage = {
        id: chatId,
        title: chatTitle || `Chat ${new Date(Date.now()).toLocaleString()}`,
        turns,
        last_updated: Date.now(),
        model: config?.selectedModel
      };
      console.log(`[Cognito ] Saving chat ${chatId} (Turns: ${turns.length})`);
      localforage.setItem(chatId, savedChat).catch(err => {
        console.error(`[Cognito ] Error saving chat ${chatId}:`, err);
      });
    }
  }, [chatId, turns, isLoading, chatTitle, config?.selectedModel, historyMode, settingsMode]);

  // Panel open/close useEffect remains the same (no Chakra UI)
  useEffect(() => {
    let cancelled = false;

    const handlePanelOpen = async () => {
      console.log("[Cognito - Revised] Panel opened. Resetting state.");
      reset();

      try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!cancelled && tab?.id && tab.url) {
            setCurrentTabInfo({ id: tab.id, url: tab.url });

            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
                console.log("[Cognito - Revised] Panel opened on restricted tab. Clearing storage.");
                storage.deleteItem('pagestring');
                storage.deleteItem('pagehtml');
                storage.deleteItem('alttexts');
                storage.deleteItem('tabledata');
                lastInjectedRef.current = { id: null, url: '' };
            } else {
                console.log("[Cognito - Revised] Panel opened on valid tab. Injection will occur if mode switched to 'page'. lastInjectedRef is currently:", lastInjectedRef.current);
            }
        } else if (!cancelled) {
            console.log("[Cognito - Revised] Panel opened, but no active tab found or tab has no URL.");
            lastInjectedRef.current = { id: null, url: '' };
            setCurrentTabInfo({ id: null, url: '' });
            storage.deleteItem('pagestring');
            storage.deleteItem('pagehtml');
            storage.deleteItem('alttexts');
            storage.deleteItem('tabledata');
        }
      } catch (error) {
        if (!cancelled) {
        console.error("[Cognito - Revised] Error during panel open tab check:", error);
          lastInjectedRef.current = { id: null, url: '' };
          setCurrentTabInfo({ id: null, url: '' });
          storage.deleteItem('pagestring');
          storage.deleteItem('pagehtml');
          storage.deleteItem('alttexts');
          storage.deleteItem('tabledata');
      }
    }
  }

    handlePanelOpen();

    return () => {
      cancelled = true;
      console.log("[Cognito - Revised] Panel closing (component unmount). Clearing cached content and resetting state.");
      storage.deleteItem('pagestring');
      storage.deleteItem('pagehtml');
      storage.deleteItem('alttexts');
      storage.deleteItem('tabledata');
      reset();
      lastInjectedRef.current = { id: null, url: '' };
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handleEditTurn remains the same (no Chakra UI)
  const handleEditTurn = (index: number, newContent: string) => {
    setTurns(prevTurns => {
      const updatedTurns = [...prevTurns];
      if (updatedTurns[index]) {
        updatedTurns[index] = { ...updatedTurns[index], rawContent: newContent };
      }
      return updatedTurns;
    });
  };

  const [isHovering, setIsHovering] = useState(false); // Keep state for hover effect

  return (
    // Replace Container with div and Tailwind classes
    // Wrap with TooltipProvider for Shadcn Tooltips
    // Close TooltipProvider
    <TooltipProvider delayDuration={500}>
      <div
        ref={containerRef}
        className={cn(
          "w-full min-h-dvh p-0 relative overflow-hidden", // maxWidth, minHeight, padding, position, overflow
          "flex flex-col bg-[var(--bg)]" // display, flexDirection, bg
        )}
      >
        {/* Replace Box with div */}
        <div
          className={cn(
            "flex flex-col justify-between min-h-dvh",
          )}
        >
          {/* Header remains the same */}
          <Header
            chatTitle={chatTitle}
            deleteAll={deleteAll}
            downloadImage={() => downloadImage(turns)}
            downloadJson={() => downloadJson(turns)}
            downloadText={() => downloadText(turns)}
            historyMode={historyMode}
            reset={reset}
            setHistoryMode={setHistoryMode}
            setSettingsMode={setSettingsMode}
            settingsMode={settingsMode}
          />
          {settingsMode && (
            <div id="settings" className="relative flex-grow overflow-auto"> {/* Added wrapper with ID and relative positioning */}
              <Settings />
            </div>
          )}

          {/* Replace Box with div */}
          <div className="flex flex-col min-h-0"> {/* display, flexDir, flex="1 1 0%", minHeight={0} */}
            {!settingsMode && !historyMode && turns.length > 0 && (
                  <Messages
                    isLoading={isLoading}
                    turns={turns}
                    settingsMode={settingsMode}
                    onReload={onReload}
                    onEditTurn={handleEditTurn}
                  />
                )}
            {!settingsMode && !historyMode && turns.length === 0 && !config?.chatMode && (
              // Replace Box with div for icon container
              (<div className="absolute bottom-16 left-8 flex flex-col gap-2"> {/* bottom, left, position, display, flexDirection, gap */}
                {/* --- Compute Level Button (Migrated) --- */}
                <Tooltip>
                  <TooltipTrigger>
                    {/* Replace IconButton with Shadcn Button */}
                    <Button
                      aria-label="Cycle compute level"
                      variant="ghost" // variant="ghost"
                      size="icon" // size="lg" -> maps to h-11 w-11 in Shadcn default
                      onClick={() => { // Keep onClick
                        const currentLevel = config.computeLevel;
                        const nextLevel = currentLevel === 'low' ? 'medium' : currentLevel === 'medium' ? 'high' : 'low';
                        updateConfig({ computeLevel: nextLevel });
                      }}
                      className={cn(
                        "hover:bg-secondary/70", // _hover.bg approximation
                        // Conditional text color based on level
                        config.computeLevel === 'high' ? 'text-red-600' :
                        config.computeLevel === 'medium' ? 'text-orange-300' :
                        'text-[var(--text)]' // Default color
                      )}
                    >
                      <BiBrain /> {/* Keep icon */}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)] max-w-80"> {/* Map placement, bg, color */}
                    <p>{`Compute Level: ${config.computeLevel?.toUpperCase()}. Click to change. [Warning]: beta feature and resource costly.`}</p> {/* Map label */}
                  </TooltipContent>
                </Tooltip>
                {/* --- Web Search Button (Migrated) --- */}
                <Tooltip>
                  <TooltipTrigger>
                    {/* Replace IconButton with Shadcn Button */}
                    <Button
                      aria-label="Add Web Search Results to LLM Context"
                      variant="ghost"
                      size="icon"
                      onClick={() => { updateConfig({ chatMode: 'web' }); }}
                      className="text-[var(--text)] hover:bg-secondary/70" // color, _hover.bg
                    >
                      <TbWorldSearch />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                    <p>Add Web Search Results to LLM Context</p>
                  </TooltipContent>
                </Tooltip>
                {/* --- Page Context Button (Migrated) --- */}
                <Tooltip>
                  <TooltipTrigger>
                    {/* Replace IconButton with Shadcn Button */}
                    <Button
                      aria-label="Add Current Web Page to LLM Context"
                      variant="ghost"
                      size="icon"
                      onClick={() => { updateConfig({ chatMode: 'page' }); }}
                      className="text-[var(--text)] hover:bg-secondary/70"
                    >
                      <TbBrowserPlus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[var(--active)]/50 text-[var(--text)] border-[var(--text)]">
                    <p>Add Current Web Page to LLM Context</p>
                  </TooltipContent>
                </Tooltip>
              </div>)
                )}
            {!settingsMode && !historyMode && config?.chatMode === "page" && (
                   // Replace Box with div for page mode templates container
                   (<div
                      className={cn(
                        "fixed bottom-14 left-0 right-0", // bottom, left, right, position
                        "flex flex-row justify-center", // display, flexDirection, justifyContent
                        "w-full h-12 z-[2]", // maxWidth, height, zIndex
                        "transition-all duration-200 ease-in-out", // transition
                        isHovering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2.5", // opacity, transform based on state
                        "bg-transparent px-0 py-0" // sx background, padding
                      )}
                      style={{ backdropFilter: 'blur(10px)' }} // Keep backdropFilter from sx
                      onMouseEnter={() => setIsHovering(true)} // Keep event handlers
                      onMouseLeave={() => setIsHovering(false)}
                   >
                     {/* Replace HStack with div and flex/spacing */}
                     <div className="flex items-center space-x-6 max-w-full overflow-x-auto px-4"> {/* spacing, maxW, overflowX, px */}
                       {/* Use migrated MessageTemplate */}
                       <MessageTemplate onClick={() => onSend('Provide your summary.')}>
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
                     </div>
                   </div>)
            )}
          </div>

          {/* Input Area */}
          {!settingsMode && !historyMode && (
            // Replace Box with div
            (<div
              className={cn(
                "bg-[var(--active)] border-t border-[var(--text)]", // background, borderTop
                "flex justify-between items-center", // display, justifyContent, alignItems (added for vertical alignment)
                "pb-1 pt-1 relative z-[2]",
                "not-focus-visible" // pb, pt, position, zIndex
              )}
              style={{ opacity: settingsMode ? 0 : 1 }} // Keep inline style for opacity
            >
              {/* Input, AddToChat, Send components remain the same */}
              <Input isLoading={isLoading} message={message} setMessage={setMessage} onSend={onSend} />
              <AddToChat />
              <Send isLoading={isLoading} onSend={() => onSend(message)} />
            </div>)
          )}

          {/* History Area */}
          {historyMode && (
            <ChatHistory
            className="flex-1 w-full overflow-y-auto min-h-0"
            loadChat={loadChat}
              onDeleteAll={deleteAll}
            />
          )}

          {/* Background remains the same */}
          {config?.backgroundImage ? <Background /> : null}
        </div>

        {/* Toaster remains the same */}
        <Toaster
          containerStyle={{
            borderRadius: 16,
            bottom: '60px',
          }}
          toastOptions={{
            duration: 2000,
            position: "bottom-center",
            style: {
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: "1rem",
              border: '1px solid var(--text)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            success: {
              duration: 2000,
              style: {
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: "1.25rem"
              }
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
};


export default Cognito;