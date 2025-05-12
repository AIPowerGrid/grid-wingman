import { Dispatch, SetStateAction, useRef } from 'react';
import { MessageTurn } from '../ChatHistory'; // Adjust path if needed
import { fetchDataAsStream, webSearch, processQueryWithAI } from '../network';
import storage from 'src/background/storageUtil';
import type { Config, Model } from 'src/types/config';
import { normalizeApiEndpoint } from 'src/background/util';
import { handleHighCompute, handleMediumCompute } from './computeHandlers';

// Import pdf.js
import * as pdfjsLib from 'pdfjs-dist';

// Set the workerSrc for pdf.js
// Make sure 'pdf.worker.mjs' is accessible at the root of your extension.
// If you've placed it in a subdirectory (e.g., 'assets'), adjust the path.
// e.g., chrome.runtime.getURL('assets/pdf.worker.mjs')
try {
  const workerUrl = chrome.runtime.getURL('pdf.worker.mjs');
  // Check if the URL is valid before assigning, to prevent errors if the file is missing
  if (workerUrl) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  } else {
    console.error("Failed to get URL for pdf.worker.mjs. PDF parsing might fail.");
  }
} catch (e) {
    console.error("Error setting pdf.js worker source:", e);
}


interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const getAuthHeader = (config: Config, currentModel: Model) => {
  // ... (getAuthHeader remains the same)
  if (currentModel?.host === 'groq' && config.groqApiKey) {
    return { Authorization: `Bearer ${config.groqApiKey}` };
  }
  if (currentModel?.host === 'gemini' && config.geminiApiKey) {
    return { Authorization: `Bearer ${config.geminiApiKey}` };
  }
  if (currentModel?.host === 'openai' && config.openAiApiKey) {
    return { Authorization: `Bearer ${config.openAiApiKey}` };
  }
  if (currentModel?.host === 'openrouter' && config.openRouterApiKey) {
    return { Authorization: `Bearer ${config.openRouterApiKey}` };
  }
  if (currentModel?.host === 'custom' && config.customApiKey) {
    return { Authorization: `Bearer ${config.customApiKey}` };
  }
  return undefined;
};

// Helper function to extract text from a PDF URL
async function extractTextFromPdf(pdfUrl: string, callId?: number): Promise<string> {
  try {
    console.log(`[${callId || 'PDF'}] Attempting to fetch PDF from URL: ${pdfUrl}`);
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    console.log(`[${callId || 'PDF'}] PDF fetched, size: ${arrayBuffer.byteLength} bytes. Parsing...`);

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`[${callId || 'PDF'}] PDF parsed. Number of pages: ${pdf.numPages}`);
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      fullText += pageText + '\n\n'; // Add double newline between pages for readability
      if (i % 10 === 0 || i === pdf.numPages) { // Log progress for large PDFs
        console.log(`[${callId || 'PDF'}] Extracted text from page ${i}/${pdf.numPages}`);
      }
    }
    console.log(`[${callId || 'PDF'}] PDF text extraction complete. Total length: ${fullText.length}`);
    return fullText.trim();
  } catch (error) {
    console.error(`[${callId || 'PDF'}] Error extracting text from PDF (${pdfUrl}):`, error);
    // Optionally, rethrow or return a specific error message string
    throw error; // Rethrow to be caught by the caller
  }
}


const useSendMessage = (
  isLoading: boolean,
  originalMessage: string,
  currentTurns: MessageTurn[],
  _webContent: string, 
  config: Config | null | undefined,
  setTurns: Dispatch<SetStateAction<MessageTurn[]>>,
  setMessage: Dispatch<SetStateAction<string>>,
  setWebContent: Dispatch<SetStateAction<string>>,
  setPageContent: Dispatch<SetStateAction<string>>,
  setLoading: Dispatch<SetStateAction<boolean>>
) => {
  const completionGuard = useRef<number | null>(null);

  const onSend = async (overridedMessage?: string) => {
    const callId = Date.now();
    console.log(`[${callId}] useSendMessage: onSend triggered.`);
    
    const message = overridedMessage || originalMessage;

    // ... (initial checks for isLoading, message, config, completionGuard remain the same)
    if (isLoading) {
      console.log(`[${callId}] useSendMessage: Bailing out: isLoading is true.`);
      return;
    }
    if (!message || !config) {
      console.log(`[${callId}] useSendMessage: Bailing out: Missing message or config.`);
      return;
    }

    if (completionGuard.current !== null) {
        console.warn(`[${callId}] useSendMessage: Bailing out: Another send operation (ID: ${completionGuard.current}) is already in progress.`);
        return;
    }

    console.log(`[${callId}] useSendMessage: Setting loading true.`);
    setLoading(true);
    setWebContent('');
    setPageContent('');
    completionGuard.current = callId;
    
    const updateAssistantTurn = (update: string, isFinished: boolean, isError?: boolean) => {
      // ... (updateAssistantTurn remains the same as your corrected version)
      if (completionGuard.current !== callId && !isFinished && !(isError === true) ) {
        console.log(`[${callId}] updateAssistantTurn: Guard mismatch (current: ${completionGuard.current}), skipping non-final update.`);
        return;
      }

      setTurns(prevTurns => {
        if (prevTurns.length === 0 || prevTurns[prevTurns.length - 1].role !== 'assistant') {
          console.warn(`[${callId}] updateAssistantTurn: No assistant turn found or last turn is not assistant.`);
          if (isError) {
            const errorTurn: MessageTurn = {
              role: 'assistant',
              rawContent: `Error: ${update || 'Unknown operation error'}`,
              status: 'error',
              timestamp: Date.now(),
            };
            return [...prevTurns, errorTurn];
          }
          return prevTurns;
        }
        const lastTurn = prevTurns[prevTurns.length - 1];
        const updatedContent = (isError === true) ? `Error: ${update || 'Unknown stream/handler error'}` : update;
        const updatedStatus = (isError === true) ? 'error' : (isFinished ? 'complete' : 'streaming');
        
        return [
          ...prevTurns.slice(0, -1),
          {
            ...lastTurn,
            rawContent: updatedContent,
            status: updatedStatus,
            timestamp: Date.now()
          }
        ];
      });

      if (isFinished || (isError === true)) {
        console.log(`[${callId}] updateAssistantTurn: Final state (Finished: ${isFinished}, Error: ${isError}). Clearing guard and loading.`);
        setLoading(false);
        completionGuard.current = null;
      }
    };

    const userTurn: MessageTurn = {
      role: 'user',
      status: 'complete',
      rawContent: message,
      timestamp: Date.now()
    };
    setTurns(prevTurns => [...prevTurns, userTurn]);
    setMessage('');
    console.log(`[${callId}] useSendMessage: User turn added to state.`);

    let queryForProcessing = message;
    let searchRes: string = '';
    let processedQueryDisplay = '';

    const performSearch = config?.chatMode === 'web';
    const currentModel = config?.models?.find(m => m.id === config.selectedModel);

    if (!currentModel) {
      console.error(`[${callId}] useSendMessage: No current model found.`);
      updateAssistantTurn("Configuration error: No model selected.", true, true);
      return;
    }
    const authHeader = getAuthHeader(config, currentModel);

    // ... (Step 1: Optimize Query remains the same)
    if (performSearch) {
      console.log(`[${callId}] useSendMessage: Optimizing query...`);
      const historyForQueryOptimization: ApiMessage[] = currentTurns.map(turn => ({
        role: turn.role,
        content: turn.rawContent
      }));
      try {
        const optimizedQuery = await processQueryWithAI(
          message,
          config,
          currentModel,
          authHeader,
          historyForQueryOptimization
        );
        if (optimizedQuery && optimizedQuery.trim() && optimizedQuery !== message) {
          queryForProcessing = optimizedQuery;
          processedQueryDisplay = `**SUB:** [*${queryForProcessing}*]\n\n`;
          console.log(`[${callId}] useSendMessage: Query optimized to: "${queryForProcessing}"`);
        } else {
          processedQueryDisplay = `**ORG:** (${queryForProcessing})\n\n`;
          console.log(`[${callId}] useSendMessage: Using original query: "${queryForProcessing}"`);
        }
      } catch (optError) {
        console.error(`[${callId}] Query optimization failed:`, optError);
        processedQueryDisplay = `**ORG:** (${queryForProcessing}) [Optimization Failed]\n\n`;
      }
    } else {
      queryForProcessing = message;
    }

    // ... (Step 2: Perform Web Search remains the same)
    if (performSearch) {
      console.log(`[${callId}] useSendMessage: Performing web search...`);
      try {
        searchRes = await webSearch(queryForProcessing, config.webMode || 'Google');
      } catch (searchError) {
        console.error(`[${callId}] Web search failed:`, searchError);
        searchRes = ''; 
        processedQueryDisplay += `[Web Search Failed: ${searchError instanceof Error ? searchError.message : String(searchError)}]`;
      }
      console.log(`[${callId}] useSendMessage: Web search done. Length: ${searchRes.length}`);
    }

    const messageToUse = performSearch ? queryForProcessing : message;
    const webLimit = 1000 * (config?.webLimit || 1);
    const limitedWebResult = webLimit && typeof searchRes === 'string'
      ? searchRes.substring(0, webLimit)
      : searchRes;
    const combinedWebContentDisplay = processedQueryDisplay;
    const webContentForLlm = config?.webLimit === 128 ? searchRes : limitedWebResult;
    console.log(`[${callId}] useSendMessage: Web content prepared for display.`);

    const messageForApi: ApiMessage[] = currentTurns
      .map((turn): ApiMessage => ({
        content: turn.rawContent || '',
        role: turn.role
      }))
      .concat({ role: 'user', content: message });

    let pageContentForLlm = '';
    if (config?.chatMode === 'page') {
      let currentPageContent = '';
      console.log(`[${callId}] useSendMessage: Preparing page content...`);
      try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        
        if (tab?.url && !tab.url.startsWith('chrome://')) {
          const tabUrl = tab.url;
          // Check if the URL is likely a PDF
          // More robust checking might involve looking at tab.mimeType if available and reliable,
          // but URL extension is a good first pass.
          // Assert mimeType if type definitions are problematic. Ideally, ensure @types/chrome is up-to-date.
          const tabMimeType = (tab as chrome.tabs.Tab & { mimeType?: string }).mimeType;
          const isPdfUrl = tabUrl.toLowerCase().endsWith('.pdf') ||
                           (tabMimeType && tabMimeType === 'application/pdf');

          if (isPdfUrl) {
            console.log(`[${callId}] Detected PDF URL: ${tabUrl}. Attempting to extract text.`);
            try {
              currentPageContent = await extractTextFromPdf(tabUrl, callId);
              console.log(`[${callId}] Successfully extracted text from PDF. Length: ${currentPageContent.length}`);
            } catch (pdfError) {
              console.error(`[${callId}] Failed to extract text from PDF ${tabUrl}:`, pdfError);
              currentPageContent = `Error extracting PDF content: ${pdfError instanceof Error ? pdfError.message : "Unknown PDF error"}. Falling back.`;
              // Optionally, try to get storedPageString as a fallback if PDF extraction fails
              // const storedPageString = await storage.getItem('pagestring');
              // currentPageContent = storedPageString || `Failed to process PDF: ${tabUrl}`;
            }
          } else {
            // Not a PDF, use existing logic for HTML/text content from storage
            console.log(`[${callId}] URL is not a PDF. Fetching from storage: ${tabUrl}`);
            const storedPageString = await storage.getItem('pagestring');
            currentPageContent = storedPageString || '';
            console.log(`[${callId}] Retrieved page text content from storage. Length: ${currentPageContent.length}`);
          }
        } else {
          console.log(`[${callId}] Not fetching page content for URL: ${tab?.url} (might be chrome:// or no active tab).`);
        }
      } catch (pageError) {
        console.error(`[${callId}] Error getting active tab or initial page processing:`, pageError);
        currentPageContent = `Error accessing page content: ${pageError instanceof Error ? pageError.message : "Unknown error"}`;
      }

      const charLimit = 1000 * (config?.contextLimit || 1);
      const safeCurrentPageContent = typeof currentPageContent === 'string' ? currentPageContent : '';
      const limitedContent = charLimit && safeCurrentPageContent
        ? safeCurrentPageContent.substring(0, charLimit)
        : safeCurrentPageContent;
      pageContentForLlm = config?.contextLimit === 128 ? safeCurrentPageContent : limitedContent;
      setPageContent(pageContentForLlm || '');
      console.log(`[${callId}] Page content prepared for LLM. Length: ${pageContentForLlm?.length}`);
    } else {
      setPageContent('');
    }

    const persona = config?.personas?.[config?.persona] || '';
    const systemContent = `
      ${persona}
      ${pageContentForLlm ? `. Use the following page content for context: ${pageContentForLlm}` : ''}
      ${webContentForLlm ? `. Refer to this web search summary: ${webContentForLlm}` : ''}
    `.trim().replace(/\s+/g, ' ');
    console.log(`[${callId}] useSendMessage: System prompt constructed.`);

    const assistantTurnPlaceholder: MessageTurn = {
      role: 'assistant',
      rawContent: '',
      status: 'streaming',
      webDisplayContent: combinedWebContentDisplay,
      timestamp: Date.now() + 1
    };
    setTurns(prevTurns => [...prevTurns, assistantTurnPlaceholder]);
    console.log(`[${callId}] useSendMessage: Assistant placeholder turn added.`);

    // --- Step 4: Execute based on Compute Level ---
    try {
      // ... (rest of the try block for compute levels and fetchDataAsStream remains the same)
      if (config?.computeLevel === 'high' && currentModel) {
        console.log(`[${callId}] useSendMessage: Starting HIGH compute level.`);
        await handleHighCompute(
          messageToUse,
          currentTurns,
          config,
          currentModel,
          authHeader,
          (update, isFinished) => updateAssistantTurn(update, isFinished)
        );
        console.log(`[${callId}] useSendMessage: HIGH compute level finished.`);
      } else if (config?.computeLevel === 'medium' && currentModel) {
        console.log(`[${callId}] useSendMessage: Starting MEDIUM compute level.`);
        await handleMediumCompute(
          messageToUse,
          currentTurns,
          config,
          currentModel,
          authHeader,
          (update, isFinished) => updateAssistantTurn(update, isFinished)
        );
        console.log(`[${callId}] useSendMessage: MEDIUM compute level finished.`);
      } else {
        console.log(`[${callId}] useSendMessage: Starting standard streaming.`);
        const normalizedUrl = normalizeApiEndpoint(config?.customEndpoint);
        const configBody = { stream: true };
        const urlMap: Record<string, string> = {
          groq: 'https://api.groq.com/openai/v1/chat/completions',
          ollama: `${config?.ollamaUrl || ''}/api/chat`,
          gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`,
          openai: 'https://api.openai.com/v1/chat/completions',
          openrouter: 'https://openrouter.ai/api/v1/chat/completions',
          custom: config?.customEndpoint ? `${normalizedUrl}/v1/chat/completions` : '',
        };
        const host = currentModel.host || '';
        const url = urlMap[host];

        if (!url) {
          throw new Error(`Could not determine API URL for host: ${currentModel.host}`);
        }

        console.log(`[${callId}] useSendMessage: Sending chat request to ${url}`);
        await fetchDataAsStream(
          url,
          {
            ...configBody,
            model: config?.selectedModel || '',
            messages: [
              { role: 'system', content: systemContent },
              ...messageForApi
            ],
            temperature: config?.temperature ?? 0.7,
            max_tokens: config?.maxTokens ?? 32048,
            top_p: config?.topP ?? 1,
            presence_penalty: config?.presencepenalty ?? 0,
          },
          (part: string, isFinished?: boolean, isError?: boolean) => {
            updateAssistantTurn(part, Boolean(isFinished), Boolean(isError));
            if (isFinished || isError) {
              console.log(`[${callId}] fetchDataAsStream Callback: Stream finished/errored.`);
            }
          },
          authHeader,
          currentModel.host || ''
        );
        console.log(`[${callId}] useSendMessage: fetchDataAsStream call INITIATED.`);
      }
    } catch (error) {
      console.error(`[${callId}] useSendMessage: Error during send operation:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateAssistantTurn(errorMessage, true, true);
    }
    console.log(`[${callId}] useSendMessage: onSend processing logic completed.`);
  };

  return onSend;
}

export default useSendMessage;