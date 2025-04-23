![](/public/images/ein.png)

# Cognito

All-around tiny browser-augmented chat client for open-source language models. Develop based on [sidellama](https://github.com/gyopak/sidellama)

## Plan

- repair the custom openai endpoint

Notes: 
1. I will mainly fix bugs (and pull requests if any). ~At least for now, adding new functions is too hard for me. Comparison mode, I will try, but...let's see. Now I am trying to migrate to a strict CSP to prevent potential XSS. After a little research, I realized it's just too much work to do because of the UI again. Anyway. Forget it.~ 
2. The markdown this project is using is react-markdown & redux-GFM. React‑Markdown uses **remark‑parse**, which follows the CommonMark rules strictly: The content of a code fence is treated as literal text, not parsed as inlines.  The first word of the info string is typically used to specify the language…:contentReference[oaicite:1]{index=1}. So, because the fences collide for nested code blocks, remark‑parse never sees inner lines as *inside* a code fence. I tried CSS, and it conflicts with my current style. Meanwhile, I have not seen it perfectly rendered either; besides, nested code is not very common to use for this scenario. So I just leave it there. You are welcome to solve it!


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
