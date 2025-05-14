import { events } from 'fetch-event-stream';
import '../types/config.ts';
import type { Config, Model } from 'src/types/config';

interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --- Helper functions (keep existing ones) ---
const cleanResponse = (response: string): string => {
  // ... (keep existing cleanResponse)
  return response
    .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove thinking blocks with content
    .replace(/["']/g, '') // Remove quotes
    .trim();
};

// --- processQueryWithAI (keep existing) ---
export const processQueryWithAI = async (
  // ... (keep existing implementation)
  query: string,
  config: Config,
  currentModel: Model,
  authHeader?: Record<string, string>,
  contextMessages: ApiMessage[] = [],
  temperatureOverride?: number
): Promise<string> => {
  // ... (keep existing implementation)
  try {
   // Ensure currentModel and host exist before trying to get the URL
   if (!currentModel?.host) {
    console.error('processQueryWithAI: currentModel or currentModel.host is undefined. Cannot determine API URL.');
    return query; // Fallback to original query
  }

  // --- CHANGE 2: Format context messages for the prompt ---
  const formattedContext = contextMessages
      .map(msg => `{{${msg.role}}}: ${msg.content}`) // Format as {{role}}: content
      .join('\n');
  // System prompt to optimize queries
  const systemPrompt = `You are a Google search query optimizer. Your task is to rewrite user's input [The user's raw input && chat history:${formattedContext}].
\n
Instructions:
**Important** No Explanation, just the optimized query!
\n
1. Extract the key keywords and named entities from the user's input.
2. Correct any obvious spelling errors.
3. Remove unnecessary words (stop words) unless they are essential for the query's meaning.
4. If the input is nonsensical or not a query, return the original input.
5. Using previous chat history to understand the user's intent.
\n
Output:
'The optimized Google search query'
\n
Example 1:
Input from user ({{user}}): where can i find cheep flights to london
Output:
'cheap flights London'
\n
Example 2:
Context: {{user}}:today is a nice day in paris i want to have a walk and find a restaurant to have a nice meal. {{assistant}}: Bonjour, it's a nice day!
Input from user ({{user}}): please choose me the best restarant
Output:
'best restaurants Paris France'
\n
Example 3:
Input from user ({{user}}): asdf;lkjasdf
Output:
'asdf;lkjasdf'
`;

    const urlMap: Record<string, string> = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      ollama: `${config?.ollamaUrl || ''}/api/chat`,
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`,
      openai: 'https://api.openai.com/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      custom: `${config?.customEndpoint || ''}/v1/chat/completions` // Ensure customEndpoint has a fallback
    };
    const apiUrl = urlMap[currentModel.host];
    if (!apiUrl) {
      console.error('processQueryWithAI: Could not determine API URL for host:', currentModel.host);
      return query; // Fallback to original query
    }

    console.log(`processQueryWithAI: Using API URL: ${apiUrl} for host: ${currentModel.host}`);
    console.log('Formatted Context for Prompt:', formattedContext);

    const requestBody: {
      model: string;
      messages: ApiMessage[];
      stream: boolean;
      temperature?: number;
    } = {
      model: config?.selectedModel || currentModel.id || '',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      stream: false
    };

    let effectiveTemperature: number | undefined = undefined;
    if (temperatureOverride !== undefined) {
      effectiveTemperature = temperatureOverride;
    } else if (config.temperature !== undefined) {
      effectiveTemperature = config.temperature;
    }

    if (effectiveTemperature !== undefined) {
      requestBody.temperature = effectiveTemperature;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authHeader || {})
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`API request failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    const rawContent = responseData?.choices?.[0]?.message?.content;
    return typeof rawContent === 'string'
      ? cleanResponse(rawContent)
      : query;

  } catch (error) {
    console.error('processQueryWithAI: Error during execution:', error);
    return query;
  }
};

// --- urlRewriteRuntime (keep existing) ---
export const urlRewriteRuntime = async function (domain: string) {
  // ... (keep existing implementation)
  try {
    const url = new URL(domain);
    if (url.protocol === 'chrome:') return;

    const domains = [url.hostname];
    const origin = `${url.protocol}//${url.hostname}`;

    const rules = [
      {
        id: 1,
        priority: 1,
        condition: { requestDomains: domains },
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'Origin',
              operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
              value: origin
            }
          ]
        }
      }
    ];

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules as chrome.declarativeNetRequest.Rule[]
    });
  } catch (error) {
    console.debug('URL rewrite skipped:', error);
  }
};


// --- NEW Helper function to extract main content from HTML ---
const extractMainContent = (htmlString: string): string => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        doc.querySelectorAll(
            'script, style, nav, footer, header, svg, img, noscript, iframe, form, aside, .sidebar, .ad, .advertisement, .banner, .popup, .modal, .cookie-banner, link[rel="stylesheet"], button, input, select, textarea, [role="navigation"], [role="banner"], [role="contentinfo"], [aria-hidden="true"]'
        ).forEach(el => el.remove());

        let contentElement = doc.querySelector('main')
            || doc.querySelector('article')
            || doc.querySelector('.content')
            || doc.querySelector('#content')
            || doc.querySelector('.main-content')
            || doc.querySelector('#main-content')
            || doc.querySelector('.post-content')
            || doc.body;

        let text = contentElement?.textContent || '';
        text = text.replace(/\s+/g, ' ').trim();
        text = text.split('\n').filter(line => line.trim().length > 20).join('\n');

        return text;
    } catch (error) {
        console.error("Error parsing HTML for content extraction:", error);
        return "[Error extracting content]";
    }
};

interface WikiSearchResultBlock {
    document_title: string;
    section_title: string;
    content: string;
    block_type: "text" | "table" | "infobox";
    language: string;
    url?: string | null;
    last_edit_date?: string | null;
    similarity_score: number;
    probability_score: number;
    summary?: string[];
}

interface WikiQueryResult {
    results: WikiSearchResultBlock[];
}


// --- ENHANCED webSearch function ---
export const webSearch = async (
    query: string,
    config: Config // Pass the full config object
): Promise<string> => {
    console.log('[webSearch] Received query:', query);
    console.log('[webSearch] Web Mode from config:', config?.webMode);

    const webMode = config.webMode;
    const maxLinksToVisit = config.serpMaxLinksToVisit ?? 3;

    const serpAbortController = new AbortController();
    const serpTimeoutId = setTimeout(() => serpAbortController.abort(), 15000);

    console.log(`Performing ${webMode} search for: "${query}"`);
    if (webMode === 'Duckduckgo' || webMode === 'Brave' || webMode === 'Google') {
        console.log(`[webSearch - ${webMode}] Max links to visit: ${maxLinksToVisit}`);
    }


    if (!webMode) {
        console.error('[webSearch] Web search mode is undefined. Aborting search. Config was:', JSON.stringify(config));
        return `Error: Web search mode is undefined. Please check your configuration.`;
    }

    try {
        if (webMode === 'Duckduckgo' || webMode === 'Brave' || webMode === 'Google') {
            const baseUrl = webMode === 'Brave'
                ? `https://search.brave.com/search?q=${encodeURIComponent(query)}`
                : webMode === 'Google'
                    ? `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us`
                    : `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

            const response = await fetch(baseUrl, {
                signal: serpAbortController.signal,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    ...(webMode === 'Brave' ? { 'Referer': 'https://search.brave.com/' } : {}),
                    ...(webMode === 'Google' ? { 'Referer': 'https://www.google.com/' } : {}),
                }
            });
            clearTimeout(serpTimeoutId);

            if (!response.ok) {
                throw new Error(`Web search failed (${webMode}) with status: ${response.status}`);
            }
            const htmlString = await response.text();
            const parser = new DOMParser();
            console.log(`[webSearch - ${webMode}] SERP HTML (first 500 chars):`, htmlString.substring(0, 500));
            const htmlDoc = parser.parseFromString(htmlString, 'text/html');

            interface SearchResult {
                title: string;
                snippet: string;
                url: string | null;
            }
            const searchResults: SearchResult[] = [];

            if (webMode === 'Duckduckgo') {
                htmlDoc.querySelectorAll('.web-result').forEach(result => {
                    const titleEl = result.querySelector('.result__a');
                    const snippetEl = result.querySelector('.result__snippet');
                    const title = titleEl?.textContent?.trim() || '';
                    const url = titleEl?.getAttribute('href');
                    const snippet = snippetEl?.textContent?.trim() || '';
                    if (title && url) searchResults.push({ title, snippet, url: url.startsWith('http') ? url : `https://duckduckgo.com${url}` });
                });
            } else if (webMode === 'Google') {
                htmlDoc.querySelectorAll('div.g, div.MjjYud, div.hlcw0c').forEach(result => {
                    const linkEl = result.querySelector('a[href]');
                    const url = linkEl?.getAttribute('href');
                    const titleEl = result.querySelector('h3');
                    const title = titleEl?.textContent?.trim() || '';
                    let snippet = '';
                    const snippetEls = result.querySelectorAll('div[style="-webkit-line-clamp:2"], div[data-sncf="1"], .VwiC3b span, .MUxGbd span');
                    if (snippetEls.length > 0) {
                        snippet = Array.from(snippetEls).map(el => el.textContent).join(' ').replace(/\s+/g, ' ').trim();
                    } else {
                        const containerText = result.textContent || '';
                        const titleIndex = title ? containerText.indexOf(title) : -1;
                        if (titleIndex !== -1) {
                           snippet = containerText.substring(titleIndex + title.length).replace(/\s+/g, ' ').trim().substring(0, 300);
                        }
                    }
                    if (title && url && url.startsWith('http')) {
                        searchResults.push({ title, snippet, url });
                    }
                });
            } else if (webMode === 'Brave') {
                htmlDoc.querySelectorAll('#results .snippet[data-type="web"]').forEach(result => {
                    const linkEl = result.querySelector('a[href]');
                    const url = linkEl?.getAttribute('href');
                    const title = linkEl?.querySelector('.title')?.textContent?.trim() || '';
                    const snippet = result.querySelector('.snippet-description')?.textContent?.trim() || '';
                    if (title && url && url.startsWith('http')) {
                        searchResults.push({ title, snippet, url });
                    }
                });
                 if (searchResults.length === 0) { // Fallback selector for Brave
                     htmlDoc.querySelectorAll('.organic-result').forEach(result => {
                        const linkEl = result.querySelector('a[href]');
                        const url = linkEl?.getAttribute('href');
                        const title = result.querySelector('h3')?.textContent?.trim() || '';
                        const snippet = result.querySelector('.snippet-content')?.textContent?.trim() || '';
                         if (title && url && url.startsWith('http')) {
                             searchResults.push({ title, snippet, url });
                         }
                     });
                 }
            }
            console.log(`[webSearch - ${webMode}] Parsed SERP Results (${searchResults.length} found, showing first 5):`, JSON.stringify(searchResults.slice(0, 5)));

            if (searchResults.length === 0) {
                console.log("No search results found on SERP.");
                return 'No results found.';
            }

            const linksToFetch = searchResults.slice(0, maxLinksToVisit).filter(r => r.url);
            console.log(`Found ${searchResults.length} results. Attempting to fetch content from top ${linksToFetch.length} links (maxLinksToVisit: ${maxLinksToVisit}).`);

            const pageFetchPromises = linksToFetch.map(async (result) => {
                if (!result.url) return { ...result, content: '[Invalid URL]', status: 'error' };
                console.log(`Fetching content from: ${result.url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);
                try {
                    const pageResponse = await fetch(result.url, {
                        signal: controller.signal,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                        }
                    });
                    clearTimeout(timeoutId);
                    if (!pageResponse.ok) throw new Error(`Failed to fetch ${result.url} - Status: ${pageResponse.status}`);
                    const contentType = pageResponse.headers.get('content-type');
                    if (!contentType || !contentType.includes('text/html')) throw new Error(`Skipping non-HTML content (${contentType}) from ${result.url}`);
                    const pageHtml = await pageResponse.text();
                    const mainContent = extractMainContent(pageHtml);
                    // Here you could potentially use config.webLimit to truncate mainContent if desired
                    // e.g., if (config.webLimit && config.webLimit !== 128) mainContent = mainContent.substring(0, config.webLimit * 1000);
                    console.log(`[webSearch - ${webMode}] Successfully fetched and extracted content from: ${result.url} (Extracted Length: ${mainContent.length})`);
                    return { ...result, content: mainContent, status: 'success' };
                } catch (error: any) {
                    clearTimeout(timeoutId);
                    console.warn(`Failed to fetch or process ${result.url}:`, error.message);
                    return { ...result, content: `[Error fetching/processing: ${error.message}]`, status: 'error' };
                }
            });

            const fetchedPagesResults = await Promise.allSettled(pageFetchPromises);
            let combinedResultsText = `Search results for "${query}" using ${webMode}:\n\n`;
            let pageIndex = 0; // To correctly map fetchedPagesResults to searchResults being iterated
            searchResults.forEach((result, index) => {
                 combinedResultsText += `[Result ${index + 1}: ${result.title}]\n`;
                 combinedResultsText += `URL: ${result.url || '[No URL Found]'}\n`;
                 combinedResultsText += `Snippet: ${result.snippet || '[No Snippet]'}\n`;

                 // Only add content if this result was among those fetched (i.e., index < linksToFetch.length which is <= maxLinksToVisit)
                 if (index < linksToFetch.length) {
                     const correspondingFetch = fetchedPagesResults[pageIndex];
                     if (correspondingFetch?.status === 'fulfilled') {
                         const fetchedData = correspondingFetch.value;
                         // Double check if the URL matches, as Promise.allSettled preserves order of original promises
                         if (fetchedData.url === result.url) {
                            const contentPreview = fetchedData.content.substring(0, 1500); // Current preview length
                            combinedResultsText += `Content:\n${contentPreview}${fetchedData.content.length > 1500 ? '...' : ''}\n\n`;
                         } else {
                             // This case should ideally not happen if pageIndex is managed correctly
                             combinedResultsText += `Content: [Content fetch mismatch - data for ${fetchedData.url} found, expected ${result.url}]\n\n`;
                         }
                     } else if (correspondingFetch?.status === 'rejected') {
                         combinedResultsText += `Content: [Error fetching: ${correspondingFetch.reason}]\n\n`;
                     } else {
                         // Should not happen if fetchedPagesResults has an entry for each promise
                         combinedResultsText += `Content: [Fetch status unknown]\n\n`;
                     }
                     pageIndex++; // Increment for the next fetched result
                 } else {
                     // This result was not in the linksToFetch list (beyond maxLinksToVisit)
                     combinedResultsText += `Content: [Not fetched due to link limit]\n\n`;
                 }
            });
            console.log("Web search finished. Returning combined results.");
            return combinedResultsText.trim();

        } else if (webMode === 'Wikipedia') {
            const WIKIPEDIA_API_URL = 'https://search.genie.stanford.edu/wikipedia_20250320';
            const requestBody: {
                query: string[];
                num_blocks: number;
                rerank?: boolean;
                num_blocks_to_rerank?: number;
            } = {
                query: [query],
                // Use config values with defaults
                num_blocks: config.wikiNumBlocks ?? 3,
            };

            if (config.wikiRerank) { // Default for wikiRerank is false if not in config
                requestBody.rerank = true;
                // Default for wikiNumBlocksToRerank, ensuring it's at least num_blocks or a sensible value like 10
                requestBody.num_blocks_to_rerank = config.wikiNumBlocksToRerank ?? Math.max(requestBody.num_blocks, 10);
            }

            console.log(`Performing Wikipedia search for: "${query}" with params:`, requestBody);
            try {
                const response = await fetch(WIKIPEDIA_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                    signal: serpAbortController.signal,
                });
                clearTimeout(serpTimeoutId);

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Wikipedia API request failed with status ${response.status}: ${errorBody}`);
                }

                const apiResponse: WikiQueryResult[] = await response.json();
                console.log(`[webSearch - Wikipedia] Raw API Response (first result block if exists):`, apiResponse && apiResponse.length > 0 ? JSON.stringify(apiResponse[0]?.results?.slice(0,1)) : "Empty or unexpected response");
                let combinedResultsText = `Wikipedia search results for "${query}":\n\n`;

                if (apiResponse && apiResponse.length > 0 && apiResponse[0].results) {
                    if (apiResponse[0].results.length === 0) {
                        return `No Wikipedia results found for "${query}".`;
                    }
                    apiResponse[0].results.forEach((block, index) => {
                      console.log(`[webSearch - Wikipedia] Processing result block ${index + 1}:`, {title: block.document_title, section: block.section_title, summary_length: block.summary?.length, content_length: block.content?.length});
                        combinedResultsText += `[Wiki Result ${index + 1}: ${block.document_title}${block.section_title ? ` - ${block.section_title}` : ''}]\n`;
                        
                        if (block.summary && block.summary.length > 0) {
                            combinedResultsText += 'Summary:\n' + block.summary.map(s => `  - ${s}`).join('\n') + '\n';
                        } else {
                            // Truncate content if no summary is available
                            const contentPreview = block.content.substring(0, 700);
                            combinedResultsText += `Content: ${contentPreview}${block.content.length > 700 ? '...' : ''}\n`;
                        }
                        
                        combinedResultsText += `URL: ${block.url || 'N/A'}\n`;
                        combinedResultsText += `Language: ${block.language}, Type: ${block.block_type}, Score: ${block.probability_score?.toFixed(3)}\n`;
                        if (block.last_edit_date) {
                            try {
                                combinedResultsText += `Last Edited: ${new Date(block.last_edit_date).toLocaleDateString()}\n`;
                            } catch (e) { /* ignore date parsing error */ }
                        }
                        combinedResultsText += '\n';
                    });
                } else {
                    return `No Wikipedia results found or unexpected API response for "${query}".`;
                }
                return combinedResultsText.trim();
            } catch (error: any) {
                clearTimeout(serpTimeoutId);
                console.error('Wikipedia search failed:', error);
                return `Error performing Wikipedia search: ${error.message}`;
            }
          } else {
            clearTimeout(serpTimeoutId); // Clear timeout if mode is unsupported early
            return `Unsupported web search mode: ${webMode}`;
        }
    } catch (error: any) {
        clearTimeout(serpTimeoutId);
        console.error('Web search overall failed:', error);
        return `Error performing web search: ${error.message}`;
    }
};


// --- fetchDataAsStream (keep existing) ---
export async function fetchDataAsStream(
    // ... (keep existing implementation)
      url: string,
      data: Record<string, unknown>,
      onMessage: (message: string, done?: boolean, error?: boolean) => void,
      headers: Record<string, string> = {},
      host: string
    ) {
      let streamFinished = false;

      const finishStream = (message: unknown, isError: boolean = false) => {
        if (!streamFinished) {
          streamFinished = true;
          let finalMessage: string;
          if (typeof message === 'string') {
            finalMessage = message;
          } else if (message && typeof message === 'object' && 'message' in message && typeof (message as any).message === 'string') {
            finalMessage = (message as any).message;
          } else {
            finalMessage = String(message);
          }
          onMessage(finalMessage, true, isError);
        }
      };

      const cleanUrl = (url: string) => {
        if (url.endsWith('/')) {
          return url.slice(0, -1);
        }
        return url;
      }

      if (url.startsWith('chrome://')) {
        console.log("fetchDataAsStream: Skipping chrome:// URL:", url);
        return;
      }

      if (url.includes('localhost')) {
        await urlRewriteRuntime(cleanUrl(url));
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          let errorBody = `Network response was not ok (${response.status})`;
          try {
             const text = await response.text();
             errorBody += `: ${text || response.statusText}`;
          } catch (_) {
             errorBody += `: ${response.statusText}`;
          }
          throw new Error(errorBody);
        }

        let str = '';

        if (host === "ollama") {
            if (!response.body) throw new Error('Response body is null for Ollama');
            const reader = response.body.getReader();
            let done, value;
            while (true) {
              ({ value, done } = await reader.read());
              if (done) break;
              const chunk = new TextDecoder().decode(value);
              const jsonObjects = chunk.split('\n').filter(line => line.trim() !== '');

              for (const jsonObjStr of jsonObjects) {
                 if (jsonObjStr.trim() === '[DONE]') {
                    finishStream(str);
                    return;
                 }
                 try {
                    const parsed = JSON.parse(jsonObjStr);
                    if (parsed.message?.content) {
                      str += parsed.message.content;
                      if (!streamFinished) onMessage(str);
                    }
                    if (parsed.done === true && !streamFinished) {
                       finishStream(str);
                       return;
                    }
                 } catch (error) {
                    console.debug('Skipping invalid JSON chunk:', jsonObjStr);
                 }
              }
            }
            finishStream(str);

          } else if (["lmStudio", "groq", "gemini", "openai", "openrouter", "custom"].includes(host)) {
            const stream = events(response);
            for await (const event of stream) {
              if (streamFinished) continue;
              if (!event.data) continue;

              if (event.data.trim() === '[DONE]') {
                finishStream(str);
                break;
              }

              try {
                const received = JSON.parse(event.data);
                let apiError = null;
                if (host === 'groq' && received?.x_groq?.error) apiError = received.x_groq.error;
                else if (host === 'gemini' && received?.error) apiError = received.error.message || JSON.stringify(received.error);
                else if (received?.error) apiError = received.error.message || JSON.stringify(received.error);

                if (apiError) {
                   throw new Error(`API Error: ${apiError}`);
                }

                str += received?.choices?.[0]?.delta?.content || '';
                if (!streamFinished) onMessage(str);

              } catch (error) {
                if (error instanceof Error && error.message.startsWith('API Error:')) {
                   finishStream(error.message, true);
                } else {
                   console.debug('Skipping invalid SSE chunk or parse error:', event.data, error);
                }
              }
            }
            finishStream(str);

          } else {
             throw new Error(`Unsupported host specified: ${host}`);
          }

      } catch (error) {
        console.error('Error in fetchDataAsStream:', error);
        finishStream(error instanceof Error ? error.message : String(error), true);
      }
    }