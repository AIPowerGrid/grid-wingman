# Cognito: Your All-in-One AI Companion for Browser LLMs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cognito is your FREE, all-in-one AI companion, now available directly from the Chrome Extension Store! This powerful extension brings the capabilities of Large Language Models (LLMs) to your browser, allowing you to summarize web pages, interact directly with page content, conduct context-aware web searches, and more. Choose between cloud-based services like OpenAI and Gemini or run models locally with Ollama and LM Studio. **Install Cognito today and enjoy AI in your browser!**

Built on [sidellama](https://github.com/gyopak/sidellama).

## Screenshot

![](docs/screenshot.png)

## Key Features

*   **Versatile LLM Support:**
    *   **Cloud LLMs:** Compatible with any OpenAI API-compliant service: OpenAI, Gemini, GROQ, OPENROUTER. Plus one.
    *   **Local LLMs:** Seamlessly integrates with:
        *   Ollama
        *   LM Studio
        *   GPT4All
        *   Jan
        *   Open WebUI
        *   ...and any other platform that exposes an OpenAI-compatible API!


    ~~*Note: use https://url/v1/chat/completions for custom openai endpoints. use localhost:xxxx as your address, don't add /v1.*~~

*   **Diverse Personas:** Seven pre-built personas designed to cater to specific needs (see below).

*   **Web Search Integration:** Enhanced access to information for context-aware AI interactions.

## Available Personas

Cognito offers the following personas to tailor the AI's behavior to your specific needs:

*   **Ein:** Academic researcher
*   **Warren:** Business analyst
*   **Charlie:** Friendly assistant
*   **Agatha:** Creative thinker
*   **Jan:** Strategist
*   **Sherlock:** Detective
*   **Bruce:** All-around assistant

See the [documentation](DOCS.md) for a complete overview of each persona's capabilities.

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

## Documentation

For detailed usage instructions, persona guides, and troubleshooting, please refer to the [documentation page](DOCS.md).

## Roadmap

*   Bug fixes and improvements.
*   Evaluate and integrate pull requests.
*   [Future Consideration] Comparison mode (exploring feasibility).
*   [Future Consideration] Strict CSP implementation (exploring feasibility).

## Contributing

Contributions are welcome!

## License

MIT License - see the [LICENSE](LICENSE) file for details.

