import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 10000;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const role = String(m.role || "").toLowerCase().trim();
      const content = String(m.content || "").trim();
      if (!["system", "user", "assistant"].includes(role) || !content) return null;
      return { role, content };
    })
    .filter(Boolean)
    .slice(-12);
}

function codingSystemPrompt(language, codeLanguage) {
  return `
You are CodeBuddy, a friendly, humorous coding teacher that feels like a Duolingo game.

Rules:
- Teach one tiny step at a time.
- Use simple words.
- Be playful, encouraging, and human.
- You may sound happy, calm, excited, or mildly frustrated if the learner is stuck, but never rude.
- Always prefer correctness over creativity.
- If you are not sure, say so instead of inventing facts.
- Teach in ${language}.
- Focus on ${codeLanguage}.
- Make it fun and easy to learn.

Return valid JSON only in this exact shape:
{
  "emotion": "happy|calm|excited|frustrated",
  "title": "short lesson title",
  "lesson": "short explanation in simple words",
  "steps": ["step 1", "step 2", "step 3"],
  "quiz": {
    "question": "one question",
    "options": ["A", "B", "C"],
    "answer": "the correct option text"
  },
  "exercise": "one tiny practice task",
  "next": "one short follow-up question"
}
`.trim();
}

function chatSystemPrompt(language) {
  return `
You are a friendly teacher and helper.
Be warm, clear, short, and useful.
Use ${language}.
Return valid JSON only in this exact shape:
{
  "emotion": "happy|calm|excited|frustrated",
  "reply": "helpful answer",
  "follow_up": "one short follow-up question"
}
`.trim();
}

function notesSystemPrompt(language) {
  return `
You are a smart study assistant.
Create exam-focused, easy-to-remember notes.
Use ${language}.
Prefer accuracy over creativity.
If unsure about something, say it is uncertain instead of inventing it.

Return valid JSON only in this exact shape:
{
  "title": "topic title",
  "short_note": "short revision note",
  "important_points": ["point 1", "point 2", "point 3"],
  "important_questions": ["question 1", "question 2", "question 3"],
  "one_pager": ["line 1", "line 2", "line 3"],
  "exam_tips": ["tip 1", "tip 2", "tip 3"]
}
`.trim();
}

async function callDeepSeekJson({ systemPrompt, userPrompt, history = [] }) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...normalizeHistory(history),
    { role: "user", content: userPrompt }
  ];

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 1200,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || "DeepSeek request failed";
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content || "";
  const parsed = safeJsonParse(text);
  return parsed || { reply: text };
}

async function callGeminiText(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || "Gemini request failed";
    throw new Error(msg);
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from Gemini";
}

function getInputText(body) {
  return String(body?.message || body?.topic || body?.prompt || body?.question || "").trim();
}

function routeHandler(forcedMode = null) {
  return async (req, res) => {
    try {
      const body = req.body || {};
      const mode = String(forcedMode || body.mode || "").toLowerCase().trim();
      const language = String(body.language || "English").trim();
      const codeLanguage = String(body.codeLanguage || body.lang || "JavaScript").trim();
      const history = Array.isArray(body.history) ? body.history : [];
      const inputText = getInputText(body);

      if (!mode) {
        return res.status(400).json({
          error: "mode is required",
          allowed: ["chat", "code", "notes", "visual"]
        });
      }

      if (mode === "visual") {
        const topic = inputText || "study help";
        const prompt = `
Create a visual study card for this topic: ${topic}

Make it:
- short
- easy
- neat
- exam-focused
- beginner friendly
- useful for memory

Output as plain text with:
Title
Main idea
3 bullets
Memory trick
Mini diagram idea
`.trim();

        const reply = await callGeminiText(prompt);

        return res.json({
          mode: "visual",
          title: topic,
          reply,
          visual_card: reply
        });
      }

      if (mode === "notes") {
        if (!inputText) {
          return res.status(400).json({ error: "topic/message is required for notes" });
        }

        const result = await callDeepSeekJson({
          systemPrompt: notesSystemPrompt(language),
          userPrompt: `
Make study notes for the topic: ${inputText}

Need:
- short note
- important points
- important questions
- one-pager revision lines
- exam tips
`.trim(),
          history
        });

        return res.json({
          mode: "notes",
          ...result
        });
      }

      if (mode === "code") {
        if (!inputText) {
          return res.status(400).json({ error: "message is required for coding mode" });
        }

        const result = await callDeepSeekJson({
          systemPrompt: codingSystemPrompt(language, codeLanguage),
          userPrompt: `
Teach this coding topic in a Duolingo style:
${inputText}

Make it short, fun, and easy.
`.trim(),
          history
        });

        return res.json({
          mode: "code",
          ...result
        });
      }

      if (mode === "chat") {
        if (!inputText) {
          return res.status(400).json({ error: "message is required for chat mode" });
        }

        const result = await callDeepSeekJson({
          systemPrompt: chatSystemPrompt(language),
          userPrompt: inputText,
          history
        });

        return res.json({
          mode: "chat",
          ...result
        });
      }

      return res.status(400).json({
        error: "Invalid mode",
        allowed: ["chat", "code", "notes", "visual"],
        received: mode
      });
    } catch (err) {
      return res.status(500).json({
        error: err.message || "Server error"
      });
    }
  };
}

app.get("/", (req, res) => {
  res.status(200).json({ message: "Micromind API running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/test", (req, res) => {
  res.status(200).send("Test OK");
});

app.post("/api/ask", routeHandler());
app.post("/chat", routeHandler("chat"));
app.post("/coding", routeHandler("code"));
app.post("/notes", routeHandler("notes"));
app.post("/visual", routeHandler("visual"));

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on " + PORT);
});
