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

You are a focused DSA tutor.

Answer ONLY:
- Data Structures
- Algorithms
- Complexity Analysis
- Coding Problems
- Interview DSA

Default code language:
Python unless specified.

Keep answers concise unless asked in detail.
`;

/* =========================
   RETRY SYSTEM
========================= */

function wait(ms) {

  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

}

async function generateWithRetry(
  modelName,
  retries = 2
) {

  for (let i = 0; i <= retries; i++) {

    try {

      return await ai.models.generateContentStream({

        model: modelName,

        contents: chatHistory,

        config: {

          systemInstruction,

          temperature: 0.2,

          topP: 0.8,

          topK: 20,

          maxOutputTokens: 500

        }

      });

    } catch (err) {

      console.log(
        `${modelName} retry ${i + 1}`
      );

      if (i < retries) {

        await wait(1500);

      }

    }

  }

  throw new Error("Model overloaded");

}

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

    /* SAVE USER CHAT */

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
       PRIMARY MODEL
    ========================= */

    try {

      response =
        await generateWithRetry(
          "gemini-2.5-flash"
        );

    } catch (primaryError) {

      console.log(
        "Primary model overloaded"
      );

      /* =========================
         FALLBACK MODEL
      ========================= */

      response =
        await generateWithRetry(
          "gemini-2.0-flash"
        );

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

    /* STREAM RESPONSE */

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

              hljs.highlightElement(
                block
              );

            } catch (err) {

              console.log(err);

            }

          });

      }

      scrollBottom();

    }

    /* SAVE AI RESPONSE */

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
⚠️ DSA GOD is currently busy.

Please try again in a few seconds.
      `
    );

  } finally {

    sendBtn.disabled = false;

    sendBtn.innerText =
      "Ask";

    userInput.focus();

  }

}

/* =========================
   APPEND MESSAGE
========================= */

function appendMessage(
  role,
  text
) {

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

          hljs.highlightElement(
            block
          );

        } catch (err) {

          console.log(err);

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
   TOPIC SWITCHING
========================= */

const navItems =
  document.querySelectorAll(".nav-item");

const sessionTitle =
  document.querySelector(".session-title");

navItems.forEach((item) => {

  item.addEventListener(
    "click",
    () => {

      navItems.forEach((nav) => {

        nav.classList.remove(
          "active"
        );

      });

      item.classList.add(
        "active"
      );

      sessionTitle.textContent =
        item.dataset.topic;

      chatBox.innerHTML = `
        <div class="message ai-message">
          You are now in ${item.dataset.topic}.
        </div>
      `;

    }
  );

});

/* =========================
   READY
========================= */

console.log(
  "DSA GOD READY"
);