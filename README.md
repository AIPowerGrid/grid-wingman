![](/public/images/ein.png)

# Cognito

All-around tiny chrome extension for both local and cloud LLMs. Enjoy AI in your browser. Build on [sidellama](https://github.com/gyopak/sidellama)

## Plan

~- repair the custom openai endpoint~

Notes: 
1. I will mainly fix bugs (and pull requests if any). ~At least for now, adding new functions is too hard for me. Comparison mode, I will try, but...let's see. Now I am trying to migrate to a strict CSP to prevent potential XSS. After a little research, I realized it's just too much work to do because of the UI again. Anyway. Forget it.~ 


## installation

- download the latest [release](https://github.com/3-ark/Cognito/releases)
- enable Chrome `Extensions > Developer mode`
- load the content of the extracted zip with `Load unpacked` button

### install from source

- clone the repo
- run `npm i && npm start` to generate your bundle located in `dist/chrome`
- enable chrome `Extensions > Developer mode`
- load the content of `dist/chrome` folder with `Load unpacked` button

## docs

Check out the [documentation page](/DOCS.md)

### Available Personas

Cognito comes with seven distinct personas to suit different needs:

*   **Ein:** Academic researcher focused on analyzing research papers. Delivers core problem statements, key findings with data, takeaways with implications, and insightful questions grounded in the text.
*   **Warren:** Business analyst providing actionable insights on business strategies and market trends. Emphasizes data-driven decision-making, risk assessment, and strategic planning.
*   **Charlie:** Friendly assistant for answering questions, explaining concepts, and brainstorming. Prioritizes clarity, empathy, and practical support.
*   **Agatha:** Creative thinker who excels at generating innovative ideas and solutions. Emphasizes imagination, unconventional approaches, and experimentation.
*   **Jan:** Strategist skilled at logical problem-solving, critical thinking, and long-term planning. Emphasizes structured strategies, risk assessment, and adaptability.
*   **Sherlock:** Detective focused on logical reasoning and deduction. Emphasizes breaking down complex problems, step-by-step strategies, and careful analysis.
*   **Bruce:** All-around assistant proficient in a wide range of tasks, including answering questions, explaining concepts, analyzing text, writing, and brainstorming.

![](/docs/Cognito_app.png)

Web Search
![alt text](/docs/googleparsing.png)
