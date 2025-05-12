import { events } from 'fetch-event-stream';
import '../types/config.ts';
import type { Config, Model } from 'src/types/config';
import { speakMessage } from '../background/ttsUtils';

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
      ollama: `${config?.ollamaUrl || ''}/api/chat`, // Add default empty string
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`, // Add default empty string
      openai: 'https://api.openai.com/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',    // <-- Add this
      custom: `${config?.customEndpoint}/v1/chat/completions` // <-- Corrected syntax
    };
    const apiUrl = urlMap[currentModel.host];
    if (!apiUrl) {
      console.error('processQueryWithAI: Could not determine API URL for host:', currentModel.host);
      return query; // Fallback to original query
    }

    console.log(`processQueryWithAI: Using API URL: ${apiUrl} for host: ${currentModel.host}`);
    // console.log('Chat history context:', contextMessages);
    console.log('Formatted Context for Prompt:', formattedContext); // Debug log

    const requestBody: {
      model: string;
      messages: ApiMessage[];
      stream: boolean;
      temperature?: number; // Temperature is optional in the request body
    } = {
      model: config?.selectedModel || currentModel.id || '', // Use currentModel.id as a fallback
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      stream: false // Explicitly set stream to false
    };
        // Determine the effective temperature for the API call
    let effectiveTemperature: number | undefined = undefined;
    if (temperatureOverride !== undefined) {
      effectiveTemperature = temperatureOverride;
    } else if (config.temperature !== undefined) {
      // Assuming config.temperature is the general setting.
      // If temperature is nested, e.g., config.ModelSettingsPanel?.temperature, adjust accordingly.
      effectiveTemperature = config.temperature;
    }

    // Add temperature to request body if it's defined
    if (effectiveTemperature !== undefined) {
      requestBody.temperature = effectiveTemperature;
    }

    // Adjust fetch options based on host if necessary (e.g., Gemini might need different body/headers)
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authHeader || {}) // Spread authHeader if it exists
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
              operation: 'set' as chrome.declarativeNetRequest.HeaderOperation, // Explicitly type as HeaderOperation
              value: origin
            }
          ]
        }
      }
    ];

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules as chrome.declarativeNetRequest.Rule[] // Type assertion for addRules
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

        // Remove common non-content elements
        doc.querySelectorAll(
            'script, style, nav, footer, header, svg, img, noscript, iframe, form, aside, .sidebar, .ad, .advertisement, .banner, .popup, .modal, .cookie-banner, link[rel="stylesheet"], button, input, select, textarea, [role="navigation"], [role="banner"], [role="contentinfo"], [aria-hidden="true"]'
        ).forEach(el => el.remove());

        // Try to find common main content containers
        let contentElement = doc.querySelector('main')
            || doc.querySelector('article')
            || doc.querySelector('.content')
            || doc.querySelector('#content')
            || doc.querySelector('.main-content')
            || doc.querySelector('#main-content')
            || doc.querySelector('.post-content')
            || doc.body; // Fallback to body

        // Get text content and clean up whitespace
        let text = contentElement?.textContent || '';
        text = text.replace(/\s+/g, ' ').trim(); // Replace multiple spaces/newlines with single space

        // Further cleanup (optional): remove lines that are very short or seem like menu items
        text = text.split('\n').filter(line => line.trim().length > 20).join('\n');

        return text;
    } catch (error) {
        console.error("Error parsing HTML for content extraction:", error);
        return "[Error extracting content]";
    }
};


// --- ENHANCED webSearch function ---
export const webSearch = async (
    query: string,
    webMode: string,
    maxLinksToVisit: number = 3 // Configurable number of links to visit
): Promise<string> => {
    const baseUrl = webMode === 'Brave'
        ? `https://search.brave.com/search?q=${encodeURIComponent(query)}`
        : webMode === 'Google'
            ? `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us` // Added hl/gl for consistency
            : `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const serpAbortController = new AbortController();
    const serpTimeoutId = setTimeout(() => serpAbortController.abort(), 15000); // Timeout for SERP fetch

    console.log(`Performing ${webMode} search for: "${query}"`);

    try {
        // 1. Fetch Search Engine Results Page (SERP)
        const response = await fetch(baseUrl, {
            signal: serpAbortController.signal,
            method: 'GET',
            headers: {
                // Using a realistic User-Agent is important
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9', // Request English results
                ...(webMode === 'Brave' ? { 'Referer': 'https://search.brave.com/' } : {}), // Referer specific to Brave
                ...(webMode === 'Google' ? { 'Referer': 'https://www.google.com/' } : {}),
            }
        });
        clearTimeout(serpTimeoutId);

        if (!response.ok) {
            throw new Error(`Web search failed (${webMode}) with status: ${response.status}`);
        }

        const htmlString = await response.text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(htmlString, 'text/html');

        // Clean up SERP (optional, might remove some results)
        // htmlDoc.querySelectorAll('script, style, nav, footer, header, svg, img, noscript').forEach(el => el.remove());

        // 2. Parse SERP for results (Title, Snippet, URL)
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
             // Google structure can change. Inspect elements if results are poor.
            // Common structure: .MjjYud often wraps a result. h3 for title. div[data-sncf='1'] or similar for snippet.
            htmlDoc.querySelectorAll('div.g, div.MjjYud, div.hlcw0c').forEach(result => { // Try common containers
                const linkEl = result.querySelector('a[href]');
                const url = linkEl?.getAttribute('href');
                const titleEl = result.querySelector('h3');
                const title = titleEl?.textContent?.trim() || '';

                // Snippet extraction for Google (might need refinement)
                let snippet = '';
                const snippetEls = result.querySelectorAll('div[style="-webkit-line-clamp:2"], div[data-sncf="1"], .VwiC3b span, .MUxGbd span'); // Try multiple potential snippet selectors
                if (snippetEls.length > 0) {
                    snippet = Array.from(snippetEls).map(el => el.textContent).join(' ').replace(/\s+/g, ' ').trim();
                } else {
                     // Fallback if specific selectors fail
                    const containerText = result.textContent || '';
                    const titleIndex = title ? containerText.indexOf(title) : -1;
                    if (titleIndex !== -1) {
                       snippet = containerText.substring(titleIndex + title.length).replace(/\s+/g, ' ').trim().substring(0, 300); // Limit fallback snippet length
                    }
                }


                if (title && url && url.startsWith('http')) { // Ensure it's a valid http/https URL
                    searchResults.push({ title, snippet, url });
                }
            });
        } else if (webMode === 'Brave') {
            htmlDoc.querySelectorAll('#results .snippet[data-type="web"]').forEach(result => { // Target web results specifically
                const linkEl = result.querySelector('a[href]');
                const url = linkEl?.getAttribute('href');
                const title = linkEl?.querySelector('.title')?.textContent?.trim() || '';
                const snippet = result.querySelector('.snippet-description')?.textContent?.trim() || '';

                if (title && url && url.startsWith('http')) {
                    searchResults.push({ title, snippet, url });
                }
            });
             // Brave Legacy fallback (unlikely needed now but kept for robustness)
             if (searchResults.length === 0) {
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


        if (searchResults.length === 0) {
            console.log("No search results found on SERP.");
            return 'No results found.';
        }

        // 3. Select Top N links to visit
        const linksToFetch = searchResults.slice(0, maxLinksToVisit).filter(r => r.url);
        console.log(`Found ${searchResults.length} results. Attempting to fetch content from top ${linksToFetch.length} links.`);

        // 4. Fetch content from links concurrently
        const pageFetchPromises = linksToFetch.map(async (result) => {
            if (!result.url) return { ...result, content: '[Invalid URL]', status: 'error' };

            console.log(`Fetching content from: ${result.url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout per page fetch

            try {
                const pageResponse = await fetch(result.url, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: { // Send similar headers to reduce likelihood of blocks
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        // 'Referer': baseUrl // Maybe add referer from search engine? Optional.
                    }
                    // IMPORTANT: For extensions, ensure you have host permissions in manifest.json!
                    // e.g., "host_permissions": ["<all_urls>"]
                });
                clearTimeout(timeoutId);

                if (!pageResponse.ok) {
                    throw new Error(`Failed to fetch ${result.url} - Status: ${pageResponse.status}`);
                }

                const contentType = pageResponse.headers.get('content-type');
                if (!contentType || !contentType.includes('text/html')) {
                     throw new Error(`Skipping non-HTML content (${contentType}) from ${result.url}`);
                }

                const pageHtml = await pageResponse.text();
                const mainContent = extractMainContent(pageHtml); // Use the helper function
                console.log(`Successfully fetched and extracted content from: ${result.url} (Length: ${mainContent.length})`);
                return { ...result, content: mainContent, status: 'success' };

            } catch (error: any) {
                clearTimeout(timeoutId);
                console.warn(`Failed to fetch or process ${result.url}:`, error.message);
                return { ...result, content: `[Error fetching/processing: ${error.message}]`, status: 'error' };
            }
        });

        // Wait for all fetches to settle (complete or fail)
        const fetchedPagesResults = await Promise.allSettled(pageFetchPromises);

        // 5. Combine Results into Final Output String
        let combinedResultsText = `Search results for "${query}" using ${webMode}:\n\n`;
        let pageIndex = 0;

        searchResults.forEach((result, index) => {
             combinedResultsText += `[Result ${index + 1}: ${result.title}]\n`;
             combinedResultsText += `URL: ${result.url || '[No URL Found]'}\n`;
             combinedResultsText += `Snippet: ${result.snippet || '[No Snippet]'}\n`;

             // Check if this result was fetched and add its content
             const correspondingFetch = fetchedPagesResults[pageIndex];
             if (index < maxLinksToVisit && correspondingFetch?.status === 'fulfilled') {
                 const fetchedData = correspondingFetch.value;
                 // Ensure we're matching the right result in case of errors/skips, check URL
                 if (fetchedData.url === result.url) {
                    const contentPreview = fetchedData.content.substring(0, 1500); // Limit content length per result
                    combinedResultsText += `Content:\n${contentPreview}${fetchedData.content.length > 1500 ? '...' : ''}\n\n`;
                    pageIndex++; // Increment index only if we processed a fetched page
                 } else {
                     // This case shouldn't happen with current logic but good for robustness
                     combinedResultsText += `Content: [Content fetch mismatch]\n\n`;
                 }

             } else if (index < maxLinksToVisit && correspondingFetch?.status === 'rejected') {
                 // Handle promises that were rejected (e.g., unexpected errors)
                 combinedResultsText += `Content: [Error fetching: ${correspondingFetch.reason}]\n\n`;
                 pageIndex++; // Increment index as we attempted this page
             }
             else if (index >= maxLinksToVisit) {
                 // Indicate that content wasn't fetched for results beyond the limit
                 // combinedResultsText += `Content: [Not fetched - beyond limit]\n\n`; // Optional: Add this line if you want to explicitly state it
             } else {
                 // Should not happen if maxLinksToVisit > 0 and searchResults exist
                 combinedResultsText += `Content: [Not fetched]\n\n`;
             }
        });


        console.log("Web search finished. Returning combined results.");
        // console.log("Combined Results Text:", combinedResultsText); // For Debugging
        return combinedResultsText.trim();

    } catch (error: any) {
        clearTimeout(serpTimeoutId); // Ensure timeout is cleared on error too
        console.error('Web search overall failed:', error);
        return `Error performing web search: ${error.message}`;
    }
};


// --- fetchDataAsStream (keep existing) ---
export async function fetchDataAsStream(
    // ... (keep existing implementation)
      url: string,
      data: Record<string, unknown>,
      onMessage: (message: string, done?: boolean, error?: boolean) => void, // Added optional error flag
      headers: Record<string, string> = {},
      host: string
    ) {
      let streamFinished = false; // Flag to prevent multiple final calls

      // Helper to call final message exactly once
      const finishStream = (message: unknown, isError: boolean = false) => {
        if (!streamFinished) {
          streamFinished = true;
          // Ensure message is a string, even if error object is passed accidentally
          let finalMessage: string;
          if (typeof message === 'string') {
            finalMessage = message;
          } else if (message && typeof message === 'object' && 'message' in message && typeof (message as any).message === 'string') {
            finalMessage = (message as any).message;
          } else {
            finalMessage = String(message);
          }
          onMessage(finalMessage, true, isError); // Pass done=true and error status
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
        // Optionally call finishStream with an appropriate message/error if needed
        // finishStream("Skipped chrome:// URL", true); // Or perhaps just return void silently?
        return; // Skip chrome:// URLs
      }

      if (url.includes('localhost')) {
        // Assuming cleanUrl is defined elsewhere
        await urlRewriteRuntime(cleanUrl(url));
      }
      // --- End Original URL Checks ---

      // --- Main Try/Catch for Fetch and Streaming ---
      try {
        // --- Your Original Fetch Setup (Correct Placement) ---
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(data)
          // Consider adding AbortController for timeouts if needed here too
        });
        // --- End Original Fetch Setup ---

        // Check if the fetch itself failed
        if (!response.ok) {
          // Try to get error details from the body
          let errorBody = `Network response was not ok (${response.status})`;
          try {
             const text = await response.text();
             errorBody += `: ${text || response.statusText}`;
          } catch (_) {
             // Ignore if reading body fails
             errorBody += `: ${response.statusText}`;
          }
          throw new Error(errorBody);
        }

        // --- Start Stream Processing ---
        let str = ''; // Accumulator for the response string

        // --- Refined Host-Specific Stream Logic ---
        if (host === "ollama") {
            if (!response.body) throw new Error('Response body is null for Ollama');
            const reader = response.body.getReader();
            let done, value;
            while (true) {
              ({ value, done } = await reader.read());
              if (done) break; // Exit loop if stream ends naturally
              const chunk = new TextDecoder().decode(value);

              // Split potential multiple JSON objects in one chunk (Ollama might do this)
              const jsonObjects = chunk.split('\n').filter(line => line.trim() !== '');

              for (const jsonObjStr of jsonObjects) {
                 if (jsonObjStr.trim() === '[DONE]') { // Check for [DONE] marker if Ollama uses it
                    finishStream(str);
                    return; // Exit function completely
                 }
                 try {
                    const parsed = JSON.parse(jsonObjStr);
                    if (parsed.message?.content) {
                      str += parsed.message.content;
                      if (!streamFinished) onMessage(str); // Send intermediate update
                    }
                    // Check for Ollama's own 'done' flag within the JSON
                    if (parsed.done === true && !streamFinished) {
                       finishStream(str);
                       return; // Exit function completely
                    }
                 } catch (error) {
                    console.debug('Skipping invalid JSON chunk:', jsonObjStr);
                 }
              }
            }
            // If loop finished naturally (done=true reading stream)
            finishStream(str);

          } else if (["lmStudio", "groq", "gemini", "openai", "openrouter", "custom"].includes(host)) {
            // Using fetch-event-stream for SSE
            const stream = events(response); // Assuming 'events' is correctly imported
            for await (const event of stream) {
              if (streamFinished) continue;
              if (!event.data) continue;

              // Handle [DONE] marker (relevant for non-OpenAI)
              if (event.data.trim() === '[DONE]') {
                finishStream(str);
                break; // Exit SSE loop
              }

              try {
                const received = JSON.parse(event.data);
                let apiError = null; // Check for API-reported errors in payload
                if (host === 'groq' && received?.x_groq?.error) apiError = received.x_groq.error;
                else if (host === 'gemini' && received?.error) apiError = received.error.message || JSON.stringify(received.error); // Gemini might use standard 'error' field in OpenAI compat mode
                else if (received?.error) apiError = received.error.message || JSON.stringify(received.error); // General OpenAI structure

                if (apiError) {
                   throw new Error(`API Error: ${apiError}`);
                }

                str += received?.choices?.[0]?.delta?.content || '';
                if (!streamFinished) onMessage(str); // Send intermediate update

              } catch (error) {
                if (error instanceof Error && error.message.startsWith('API Error:')) {
                   // If we already parsed an API error message, finish with error
                   finishStream(error.message, true); // Mark as error
                } else {
                   // Log JSON parse errors but potentially continue if minor
                   console.debug('Skipping invalid SSE chunk or parse error:', event.data, error);
                }
                // Decide if a parse error should terminate the stream or just be skipped
                // continue; // Or: finishStream(`Parse Error: ${error}`, true); break;
              }
            }
            // If SSE loop finished naturally (stream closed by server)
            finishStream(str);

          } else {
             // Handle unknown host
             throw new Error(`Unsupported host specified: ${host}`);
          }
          // --- End Stream Processing ---

      } catch (error) {
        // Catch errors from fetch, response.ok check, or stream processing
        console.error('Error in fetchDataAsStream:', error);
        finishStream(error instanceof Error ? error.message : String(error), true); // Finish with error state
      }
    }