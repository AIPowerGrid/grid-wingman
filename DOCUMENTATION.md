# Cognito: Comprehensive User Guide

## 1. Overview

Cognito is your intelligent browser assistant, designed to make your web experience smarter and more efficient. It acts as an AI Sidekick directly within your Chrome browser, offering features like:

*   Instant summaries of web pages.
*   Intelligent interactions: Ask questions about what you're reading, content from URLs, PDFs, or your notes.
*   Smart web search capabilities.
*   Flexible AI integration: Connect to powerful local AI models (like Ollama or LM Studio) or cloud-based services (OpenAI, Gemini).
*   And much more!

This guide will help you understand how to install, configure, and use Cognito to its full potential.

## 2. Understanding the File Structure (For Advanced Users/Developers)

While most users won't need to interact with these files directly, understanding the project's structure can be helpful for troubleshooting or development:

*   `src/`: Contains the core source code for the extension.
    *   `src/background/`: Manages background tasks, communication between different parts of the extension, and data storage.
    *   `src/content/`: Includes scripts that are injected into web pages to enable Cognito's features on those pages.
    *   `src/sidePanel/`: Powers the user interface of the Cognito side panel where you interact with the AI.
*   `components/`: Houses reusable UI elements used throughout the extension.
*   `public/`: Static assets like images and fonts.
*   `config/`: Configuration files, including settings for how the extension is built and how it behaves.
*   `README.md`: The main introductory file for the project.
*   `package.json`: Lists project dependencies and scripts for developers.
*   `LICENSE`: Contains the software license information (MIT License).
*   `DOCUMENTATION.md`: This file! Your comprehensive guide to Cognito.

## 3. Installation and Setup

There are two main ways to install Cognito:

### A. Installing the Latest Release (Recommended for Most Users)

1.  **Download:** Get the latest release package (usually a `.zip` file) from the [official Cognito releases page](https://github.com/3-ark/Cognito/releases).
2.  **Extract:** Unzip the downloaded file into a dedicated folder on your computer.
3.  **Enable Developer Mode in Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   In the top-right corner, toggle on "Developer mode."
4.  **Load the Extension:**
    *   Click the "Load unpacked" button that appears after enabling Developer mode.
    *   Select the folder where you extracted the Cognito files.
5.  Cognito should now be installed and visible in your Chrome extensions list!

### B. Installing from Source (For Developers or Advanced Users)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/3-ark/Cognito.git
    ```
2.  **Navigate to Directory:**
    ```bash
    cd Cognito
    ```
3.  **Install Dependencies and Build:**
    ```bash
    npm install && npm start
    ```
    This command will install all necessary software packages and then build the extension. The compiled extension files will be located in a folder named `dist/chrome`.
4.  **Enable Developer Mode in Chrome:** (If not already enabled)
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Toggle on "Developer mode."
5.  **Load the Extension:**
    *   Click the "Load unpacked" button.
    *   Select the `dist/chrome` folder from the cloned project directory.

## 4. Getting Started: Basic Usage

Once installed, Cognito will typically be accessible via its icon in the Chrome toolbar. Clicking this icon will open the Cognito side panel, your main interface for interacting with the AI.

*   **Summarizing a Webpage:**
    To get a quick summary of the current webpage you are viewing, simply open the Cognito side panel. Often, there will be a dedicated button or command like "Summarize this page." Cognito will then process the content of the active tab and provide you with a concise summary, helping you grasp the main points quickly.

*   **Asking Questions about Page Content:**
    You can ask Cognito questions about various types of content: the webpage you are currently reading, a PDF opened in your browser, text within your Cognito notes, or even content from URLs you provide in the chat. Type your question into the chat interface in the side panel. Cognito understands the context and can answer questions like "What are the main arguments of this document?" or "Explain this technical term from the page."

*   **Using Web Search:**
    Cognito enhances your web searching capabilities. You can ask it to search for information using search engines like Google, DuckDuckGo, or Wikipedia. This search is context-aware, meaning Cognito can use information from your current page or conversation to refine the search. For example, you could ask, "Search Wikipedia for [a specific term mentioned on the page]."

*   **Selecting Personas:**
    Tailor Cognito's responses and behavior by choosing from various AI personas. Each persona is designed with a slightly different style and area of focus:
    *   **Ein:** Academic researcher - Good for in-depth analysis and factual information.
    *   **Warren:** Business analyst - Focuses on business and financial contexts.
    *   **Jet:** Friendly assistant - Provides general assistance with a conversational tone.
    *   **Agatha:** Creative thinker - Useful for brainstorming and imaginative tasks.
    *   **Jan:** Strategist - Helps with planning and strategic thinking.
    *   **Sherlock:** Detective - Ideal for problem-solving and uncovering details.
    *   **Spike:** All-around assistant - A versatile persona for various tasks.
    You can typically switch between personas in the Cognito settings or directly within the side panel interface.

*   **Understanding Computation Levels:**
    Cognito offers unique 'Computation Levels' to adjust the AI's problem-solving approach for more complex tasks:
    *   **Low:** This is the default setting for quick answers and simple questions. Your query is sent directly to the AI model. Ideal for standard chat and straightforward information retrieval.
    *   **Medium:** For moderately complex queries. Cognito breaks down the task into smaller subtasks and then synthesizes the results into a comprehensive answer.
    *   **High:** For very complex, multi-component tasks. This level involves a more detailed two-level task decomposition (breaking the problem into stages, and then further into steps), allowing for in-depth planning and sophisticated problem-solving.
    *   **Important Considerations (Beta Feature):**
        *   The Computation Levels feature, especially Medium and High, is considered experimental.
        *   **Token Usage:** Higher computation levels significantly increase token consumption. High Compute can use 100-150x more tokens than Low Compute for the same query. This means more processing time and potentially higher costs if you are using paid AI services.
        *   **Potential Instability:** As an experimental feature, you might encounter unexpected behavior or errors, especially with High compute. Report any issues to help improve Cognito.
    Use these levels judiciously, matching the complexity of your query to the appropriate computation level.

## 5. Advanced Features

Explore these features to get even more out of Cognito:

*   **Using Notes:**
    Cognito includes a note-taking feature that allows you to save important pieces of information, snippets from webpages, or your own thoughts. These notes are valuable because they can be injected as context for the AI. For example, you can save key data points in a note and then instruct Cognito to use this specific information when answering a question, comparing information, or generating content.

*   **Connecting to AI Models:**
    Cognito provides the flexibility to choose your preferred AI engine, allowing you to balance power, privacy, and cost:
    *   **Local Models (Ollama, LM Studio, etc.):** If you have AI models running locally on your computer using platforms like Ollama or LM Studio, Cognito can connect to them. This is an excellent option for users who prioritize data privacy, want to use specialized open-source models, or need offline access.
    *   **Cloud Services (OpenAI, Gemini, etc.):** You can also configure Cognito to use powerful cloud-based AI services from providers like OpenAI (e.g., various GPT models) or Google (e.g., Gemini models). This option often gives you access to the latest, largest, and most capable models.
    Configuration for these different AI models will typically be found in Cognito's settings panel, where you can input API keys, specify model endpoints, or select from available local models.

*   **Text-to-Speech (TTS):**
    Cognito can read AI responses aloud, which can be helpful for accessibility or multitasking. This feature uses your browser's built-in text-to-speech capabilities. The README.md notes that for more natural-sounding voices, using the Microsoft Edge browser (which has its own advanced TTS) or exploring third-party Chrome extensions/APIs that integrate local TTS services (like Piper, Kokoro-FastAPI, or Orpheus-FastAPI mentioned in the README) might provide an enhanced audio experience.

## 6. Troubleshooting

_(This section will be populated with common issues and solutions if any are apparent from the existing documentation or if common patterns for such extensions are known. Initially, it might contain general advice.)_

*   **Extension Not Loading:**
    *   Ensure Developer Mode is enabled in `chrome://extensions`.
    *   Double-check that you selected the correct folder (the extracted folder for release, or `dist/chrome` for source install) when clicking "Load unpacked."
*   **AI Not Responding:**
    *   Check your AI model configuration in Cognito's settings. Ensure API keys (for cloud services) are correctly entered or that your local model server (if used) is running and accessible.
    *   If using a cloud model, verify your internet connection.
    *   Try switching to a different AI model, a different persona, or a lower computation level to see if the issue is specific to one setting.
*   **Summarization or Page Analysis Issues:**
    *   Some web pages with very complex structures, dynamic content, or paywalls might be challenging for the extension to parse perfectly.
    *   Ensure the page is fully loaded before asking Cognito to summarize or analyze it.
*   **High Token Usage or Slow Responses:**
    *   Remember that Medium and High computation levels consume significantly more tokens and time. Use them only when necessary for complex tasks.
    *   If using a cloud service, check your usage limits and billing with the AI provider.

---
This document aims to be a comprehensive guide. If you encounter issues not covered here or have suggestions, consider reporting them via the project's GitHub issues page.
