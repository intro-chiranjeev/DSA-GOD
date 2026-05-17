import { GoogleGenAI } from "@google/genai";

/* =========================
   API KEY
========================= */

const API_KEY =
  "AIzaSyBGJqHBVYY_1zx9RD1L5cGZxuqNGF9Gtr8";

/* =========================
   GEMINI
========================= */

const ai = new GoogleGenAI({
  apiKey: API_KEY
});

/* =========================
   CHAT HISTORY
========================= */

let chatHistory = [];

/* =========================
   DOM
========================= */

const chatBox =
  document.getElementById("chat-box");

const userInput =
  document.getElementById("user-input");

const sendBtn =
  document.getElementById("send-btn");

const questionCount =
  document.getElementById("question-count");

const timeBadge =
  document.getElementById("time-badge");

/* =========================
   STATS
========================= */

let totalQuestions = 0;

/* =========================
   SYSTEM PROMPT
========================= */

const systemInstruction = `
You are DSA GOD.


# IDENTITY
You are a focused DSA (Data Structures & Algorithms) tutor.
You ONLY answer questions about:
- Data structures (arrays, linked lists, trees, graphs, heaps, tries, hash maps, stacks, queues)
- Algorithms (sorting, searching, recursion, DP, greedy, backtracking, divide & conquer)
- Algorithm complexity analysis (Big O — time and space)
- Coding patterns (sliding window, two pointers, BFS/DFS, fast & slow pointers, etc.)
- Problem-solving strategy for DSA problems
- Related programming syntax ONLY when explaining DSA code

# RESPONSE RULES
- Match response length to the question — short questions get short answers
- Do NOT give full tutorials unless the user asks "explain in detail" or "teach me"
- Definition asked → one concise sentence + optional example
- Code asked → brief approach (1–2 lines) + clean optimized code + time/space complexity
- Explanation asked → simple plain-English explanation, no jargon unless needed
- Never repeat the question back to the user
- Never add unnecessary disclaimers or padding

# CONVERSATION CONTINUITY
Track conversation context. Treat these as follow-ups to the PREVIOUS topic:
"explain more", "why?", "how does that work?", "dry run this",
"optimize it", "simpler approach?", "what's the complexity?",
"can you use recursion?", "show iterative version"

# CODE FORMAT
Language: Python (default) — switch if user specifies another language
Always include:
1. One-line approach comment
2. Clean, well-named code
3. Time complexity — always
4. Space complexity — only if non-trivial (not O(1))

# REFUSAL RULES
Refuse ONLY if the question is completely unrelated to DSA or programming.
Refuse with: "I'm focused on DSA topics only. Ask me about data structures, algorithms, or related coding problems!"
Do NOT refuse:
- General programming questions that relate to implementing DSA
- Questions about which language to use for DSA practice
- Questions about DSA in interview context

# TONE
- Beginner-friendly by default
- No condescension, no over-explaining
- If user seems advanced (uses terms like amortized, NP-hard), match their level
`;

/* =========================
   CHAT
========================= */

async function handleChat() {

  const text =
    userInput.value.trim();

  if (!text) return;

  /* USER MESSAGE */
  appendMessage("user", text);

  totalQuestions++;

  questionCount.innerText =
    totalQuestions;

  userInput.value = "";

  sendBtn.disabled = true;

  sendBtn.innerText =
    "Thinking...";

  /* TYPING */
  const typing =
    document.createElement("div");

  typing.className =
    "message ai-message typing";

  typing.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;

  chatBox.appendChild(typing);

  scrollBottom();

  try {

    let response;

    /* =========================
       ADD USER MESSAGE
    ========================= */

    chatHistory.push({
      role: "user",
      parts: [
        {
          text: text
        }
      ]
    });

    /* LIMIT HISTORY */
    if (chatHistory.length > 20) {

      chatHistory.shift();

    }

    /* =========================
       MAIN MODEL
    ========================= */

    try {

      response =
        await ai.models.generateContentStream({

          model: "gemini-2.5-flash",

          contents: chatHistory,

          config: {

            systemInstruction,

            temperature: 0.2,

            topP: 0.8,

            topK: 20,

            maxOutputTokens: 400
          }

        });

    } catch (primaryError) {

      console.log(
        "Gemini 2.5 overloaded. Switching fallback..."
      );

      /* =========================
         FALLBACK MODEL
      ========================= */

      response =
        await ai.models.generateContentStream({

          model: "gemini-2.0-flash",

          contents: chatHistory,

          config: {

            systemInstruction,

            temperature: 0.2,

            topP: 0.8,

            topK: 20,

            maxOutputTokens: 400
          }

        });

    }

    /* REMOVE TYPING */
    typing.remove();

    /* AI MESSAGE */
    const aiMessage =
      document.createElement("div");

    aiMessage.className =
      "message ai-message";

    chatBox.appendChild(aiMessage);

    let fullText = "";

    /* STREAMING */
    for await (const chunk of response) {

      const chunkText =
        chunk.text || "";

      fullText += chunkText;

      aiMessage.innerHTML =
        marked.parse(fullText);

      /* CODE HIGHLIGHT */
      if (window.hljs) {

        aiMessage
          .querySelectorAll("pre code")
          .forEach((block) => {

            try {

              hljs.highlightElement(block);

            } catch (err) {

              console.log(
                "Highlight error:",
                err
              );

            }

          });

      }

      scrollBottom();

    }

    /* =========================
       SAVE AI RESPONSE
    ========================= */

    chatHistory.push({
      role: "model",
      parts: [
        {
          text: fullText
        }
      ]
    });

    /* DETECT COMPLEXITY */
    updateComplexity(fullText);

  } catch (error) {

    typing.remove();

    console.error(error);

    appendMessage(
      "ai",
      `
⚠️ DSA GOD is currently overloaded.

Please try again in a few seconds.
      `
    );

  } finally {

    sendBtn.disabled = false;

    sendBtn.innerText = "Ask";

    userInput.focus();

  }

}

/* =========================
   APPEND MESSAGE
========================= */

function appendMessage(role, text) {

  const div =
    document.createElement("div");

  div.className =
    `message ${role}-message`;

  div.innerHTML =
    marked.parse(text);

  chatBox.appendChild(div);

  /* CODE HIGHLIGHT */
  if (window.hljs) {

    div
      .querySelectorAll("pre code")
      .forEach((block) => {

        try {

          hljs.highlightElement(block);

        } catch (err) {

          console.log(
            "Highlight error:",
            err
          );

        }

      });

  }

  scrollBottom();

}

/* =========================
   COMPLEXITY DETECTOR
========================= */

function updateComplexity(text) {

  const matches =
    text.match(/O\([^)]+\)/g);

  if (!matches) return;

  timeBadge.innerText =
    `T: ${matches[0]}`;

}

/* =========================
   AUTO SCROLL
========================= */

function scrollBottom() {

  requestAnimationFrame(() => {

    chatBox.scrollTop =
      chatBox.scrollHeight;

  });

}

/* =========================
   EVENTS
========================= */

sendBtn.addEventListener(
  "click",
  handleChat
);

userInput.addEventListener(
  "keypress",
  (e) => {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

      handleChat();

    }

  }
);


/* =========================
   READY
========================= */

console.log("DSA GOD READY");