
# Wingman: Your AI Sidekick for Chrome


**Wingman** enhances your Chrome browsing experience by providing an intelligent AI assistant that interprets your needs, guides your browsing, answers queries, and interacts naturally with web content.

![](docs/web.gif) ![](docs/local.gif)

## Core Features

- **Seamless AI Integration:** Connect to a variety of powerful AI models:
  - **Local Models:** Ollama, LM Studio
  - **Cloud Services:** OpenAI, Gemini, Groq, OpenRouter
  - **Custom Connections:** Configure custom model endpoints.
- **Intelligent Content Interaction:**
  - **Instant Summaries:** Quickly grasp the essence of any webpage.
  - **Contextual Q&A:** Pose questions about the current page, PDFs, or selected text.
  - **Smart Web Search:** Perform context-aware searches using Google, DuckDuckGo, and Wikipedia, with the capability to fetch and analyze content from search results.
- **Personalized Experience:**
  - **Customizable Personas:** Select from 7 pre-built AI personalities or create your own.
  - **Computation Levels:** Adjust AI's problem-solving approach from quick answers to multi-step reasoning. Higher computation levels may consume more tokens.
  - **Themes & Appearance:** Tailor the interface to your preferences.
- **Productivity Boosters:**
  - **Note Taking:** Save context, chat snippets, and important information directly within the side panel.
  - **Text-to-Speech (TTS):** Listen to AI responses read aloud (supports browser TTS and integration with external services like Piper).
  - **Chat History:** Maintain a record of your interactions.
- **Developer-Friendly:** Built with a modern tech stack, open-source, and open to contributions.

## How It Works

**Wingman** is a Chrome extension with a modular architecture:

- **Side Panel (React & Redux):** The primary user interface for interacting with the AI, managing settings, and viewing results.
- **Background Script:** Handles communication with AI services, manages long-running tasks, injects content scripts, and coordinates actions across the extension.
- **Content Scripts:** Injected into web pages to securely access and relay page content to the Side Panel and Background Script for AI processing.

This architecture enables Wingman to understand the context of your browsing and provide relevant AI assistance without leaving your current tab.

## Technology Stack

- **React:** For building the interactive Side Panel UI.
- **TypeScript:** For robust and maintainable code.
- **Redux & `webext-redux`:** For state management across extension components.
- **Tailwind CSS:** For styling the user interface.
- **Webpack:** For bundling the extension.
- **UI Libraries:** Utilizes Radix UI components and `lucide-react` for icons.

## Getting Started

### Prerequisites

- Google Chrome

### Installation

#### Option 1: From Chrome Web Store

- Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/pphjdjdoclkedgiaahmiahladgcpohca?utm_source=item-share-cb).

#### Option 2: From Release (Manual Install)

1. Download the latest release from the [Releases page](https://github.com/AIPowerGrid/grid-wingman/releases).
2. Extract the downloaded ZIP file to a permanent folder on your computer.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** using the toggle in the top-right corner.
5. Click the **Load unpacked** button.
6. Select the folder where you extracted the ZIP file.

#### Option 3: From Source (For Developers)

1. Clone the repository:
   ```bash
   git clone https://github.com/AIPowerGrid/grid-wingman.git
   cd grid-wingman
