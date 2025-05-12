### webSearch 

**Features**

1.  **Modify Parsing:** Extract the actual URLs from the search results, not just the title and snippet.
2.  **Select Top Links:** Choose a limited number of top results to visit (e.g., the first 3) to keep it reasonably fast and avoid excessive requests.
3.  **Fetch Page Content:** For each selected URL, fetch its HTML content.
4.  **Extract Main Content:** Parse the fetched HTML and try to extract the meaningful text content, stripping out boilerplate (headers, footers, ads, navigation). This is the trickiest part and often requires heuristics.
5.  **Combine Results:** Format the output to include the original snippet *and* the extracted content from the visited page.
6.  **Concurrency:** Fetch the linked pages concurrently to speed things up, it's much faster than you click on them.

![image](.doc/websearch.png)
![image](.doc/websearch1.png)

**Detailed Explanation**

1.  **`maxLinksToVisit` Parameter:** Added a parameter to `webSearch` to control how many links are visited (defaults to 3).
2.  **`extractMainContent` Helper:** A new function to fetch HTML, parse it, remove common clutter elements (scripts, styles, navs, footers, ads, etc.), and extract text from main content areas (`<main>`, `<article>`, etc.) or the body as a fallback. This is heuristic and might not be perfect for all websites.
3.  **URL Extraction:** Modified the SERP parsing logic for Google, Brave, and DDG to reliably extract the `href` attribute (the URL) along with the title and snippet.
4.  **Concurrent Fetching:** Uses `map` with `async` and `Promise.allSettled` to fetch the content of the selected links concurrently. `Promise.allSettled` is important because it waits for all promises to either resolve or reject, allowing you to handle individual fetch failures without stopping the entire process.
5.  **Individual Timeouts:** Each page fetch now has its own timeout (`AbortController`) to prevent one slow page from blocking everything.
6.  **Content Type Check:** Added a check to ensure the fetched content is `text/html` before trying to parse it.
7.  **Error Handling:** Improved error handling for both the initial SERP fetch and individual page fetches. Failed fetches will result in an error message within the final output for that specific result.
8.  **Output Formatting:** The final string now includes the Title, URL, Snippet, and the extracted `Content` (truncated to 1500 chars) for each visited result.
9.  **User-Agent & Headers:** Using a common browser User-Agent and standard `Accept` headers for both SERP and page fetches can help avoid being blocked by websites.
10. **`manifest.json` Permissions:** `"host_permissions": ["<all_urls>"]` to `manifest.json` file. Without this, the `fetch` calls to the search result URLs will be blocked by the browser's security policies.
11. **Complexity:** This significantly increases the complexity and execution time of `webSearch`. Visiting multiple pages takes time and resources.
12. **Website Variability:** The `extractMainContent` function is a best effort. Website structures vary wildly, and it might grab too little or too much content from some pages. Libraries like Mozilla's Readability.js offer more sophisticated content extraction but are harder to integrate directly into a simple fetch function.