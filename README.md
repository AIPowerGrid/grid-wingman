![title.png](docs/title.png)
# Cognito: Your Browser's AI Brain. Free, Fast, and Always On

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Get instant summaries, intelligent searches, and AI interactions directly in your Chrome browser. Tired of information overload? Cognito cuts through the noise. Get instant summaries of any webpage, ask questions about what you're reading, and conduct smarter searches—all without leaving your browser. No subscriptions, no complex setups. Cognito is free and runs right in your Chrome browser.

Run powerful AI models directly on your computer with Ollama, LM Studio, and more – or connect to cloud services like OpenAI and Gemini. *You choose the power.*

Built on [sidellama](https://github.com/gyopak/sidellama).

## Screenshot

![](docs/screenshot.png)

## Key Features

*   **Note** You can save context in the note and inject it into LLM as you want, it's convenient for you to compare or to embed context. Memory coming soon!
*   **Instant Summaries:** Get the gist of any webpage in seconds.
*   **Intelligent Interactions:** Ask questions and get answers directly from page content.
*   **Smart Web Search:** Context-aware searches using Google, DuckDuckGo, and Wikipedia.
*   **Flexible AI Power:** Use local models (Ollama, LM Studio) or cloud services (OpenAI, Gemini).
*   **Customizable Personas:** Choose from 7 pre-built AI personalities (researcher, strategist, etc.).
*   **Advanced Problem Solving:** Unique 'Computation Levels' for simple queries to complex tasks.
*   **Reads Aloud:** Hear responses with built-in text-to-speech.

## Roadmap

*   Bug fixes and improvements.
*   Evaluate and integrate pull requests.
---

*   Replace 'deep research' with local/basic API services (even free tier)
*   "Memory" for the chat history with RAG and ~search~[20250512].
*   "Short Memory"(state) for web search and page parsing in the same task. Comparison mode.
*   Edit text content directly from sidepanel. Basically, I want to extend this to the "AI agent".
*   Add to note function (webpage, chat)
*   Better local TTS/STT by API. [add https://github.com/rhulha/StreamingKokoroJS to my extension, thanks for your code in advance.]
## Installation

### Download the Latest Release

1.  Download the latest release from [here].
2.  Enable Chrome Extensions > Developer mode.
3.  Load the content of the extracted zip with the "Load unpacked" button.

### Install from Source

1.  Clone the repository: `git clone https://github.com/3-ark/Cognito.git`
2.  Run `npm i && npm start` to generate your bundle, located in `dist/chrome`.
3.  Enable Chrome Extensions > Developer mode.
4.  Load the content of the `dist/chrome` folder with the "Load unpacked" button.

or a updated version before installation:
1. run `npm install -g npm-check-updates`
2. then `ncu -u` or `npx ncu -u`
3. load package

## Furter tweaks
**TTS** Currently, there is only basic TTS from the browser, so if you want some natural voices, you should use Edge or you have integrated TTS API from elsewhere. https://github.com/ken107/piper-browser-extension Here is an excellent Chrome extension that can add a local TTS service directly to Chrome, so you can find the downloaded models in the select dropdown in settings. And I found some https://github.com/remsky/Kokoro-FastAPI https://github.com/Lex-au/Orpheus-FastAPI, maybe we can integrate with them too. I have put a .tsx like that in the files anyway. I will look into this further. I hope someone can add this if possible, because so far it's good enough for me. But still, it's better to have some more choices without breaking anything.

**Computation Levels** Need deeper insights? Cognito's unique 'Computation Levels' let you adjust the AI's thinking power. From quick answers to complex problem-solving, tailor the AI to your task.

*   **Low:** Direct query to the LLM for a quick response. Ideal for simple questions and standard chat.
*   **Medium:** Single-level task decomposition for moderately complex queries, breaking down the task into subtasks and synthesizing the results.
*   **High:** Two-level task decomposition (stages → steps) for highly complex, multi-component tasks. This mode allows for in-depth planning and problem-solving.

**Important Considerations (Beta Phase):**

*   **Experimental Feature:** The Computation Levels feature is currently in **beta**. We encourage experimentation and feedback!
*   **Token Usage:** Higher Compute Levels significantly increase token consumption. **High Compute can use 100-150x more tokens than Low Compute for the same query.** That means time and cost, too.
*   **Potential Instability:** As a beta feature, unexpected behavior may occur. Please report any issues you encounter.

By carefully selecting the appropriate Computation Level, you can unlock the full potential of Cognito while managing your resources effectively. We believe this feature will provide a significant boost in the quality of AI-driven problem-solving.
   
## Available Personas

Cognito offers the following personas to tailor the AI's behavior to your specific needs:

*   **Ein:** Academic researcher
*   **Warren:** Business analyst
*   **Jet:** Friendly assistant
*   **Agatha:** Creative thinker
*   **Jan:** Strategist
*   **Sherlock:** Detective
*   **Spike:** All-around assistant

See the [documentation](DOCs.md) for a complete overview of each persona's capabilities.

## Documentation

For detailed usage instructions, persona guides, and troubleshooting, please refer to the [documentation page](DOCs.md).
It's outdated, so I deleted it. New Doc needs some time to complete.

## Thanks

https://github.com/stanford-oval/WikiChat
[sidellama](https://github.com/gyopak/sidellama).
https://github.com/AlexBefest/highCompute.py
https://github.com/rhulha/StreamingKokoroJS
https://github.com/ken107/piper-browser-extension

## License

MIT License - see the [LICENSE](LICENSE) file for details.

