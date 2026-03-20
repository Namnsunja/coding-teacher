const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- HELPER FUNCTIONS ---
// IMPORTANT: Ensure your helper functions (deepseekSystemPrompt, callDeepSeek, etc.) 
// are defined here or imported so they don't cause a "not defined" error.

/* 2) Coding teacher — Duolingo style */
app.post("/coding", async (req, res) => {
  try {
    const { message, history = [], language = "English", codeLanguage = "JavaScript" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const system = `
${deepseekSystemPrompt("coding", language)}

Special focus:
- Teach ${codeLanguage}.
- Make it feel like a game.
- Short lesson.
- One tiny step.
- Friendly teacher voice.
`;

    const messages = [
      { role: "system", content: system },
      ...history,
      { role: "user", content: message }
    ];

    const content = await callDeepSeek(messages, "deepseek-chat");
    const parsed = safeJson(content);

    res.json(
      parsed || {
        mood: "happy",
        title: "Coding help",
        lesson: content,
        steps: [],
        quiz: { question: "", options: [], answer: "" },
        exercise: "",
        next: ""
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 3) Short notes / important questions / one-pager notes */
app.post("/notes", async (req, res) => {
  try {
    const { topic, classLevel = "school", language = "English" } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "topic is required" });
    }

    const prompt = `
Make study material for topic: ${topic}
Class level: ${classLevel}

Need:
- short note
- important points
- likely exam questions
- one-pager revision notes
- easy and memorable
`;

    const messages = [
      { role: "system", content: deepseekSystemPrompt("notes", language) },
      { role: "user", content: prompt }
    ];

    const content = await callDeepSeek(messages, "deepseek-chat");
    const parsed = safeJson(content);

    res.json(
      parsed || {
        title: topic,
        short_note: content,
        important_points: [],
        important_questions: [],
        one_pager: []
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 4) Visual help using Gemini */
app.post("/visual", async (req, res) => {
  try {
    const { topic, style = "simple study card", language = "English" } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "topic is required" });
    }

    const prompt = `
Create a clear visual study explanation for: ${topic}

Style: ${style}
Language: ${language}

Return:
- title
- 3-5 short visual bullets
- simple diagram idea
- memory trick
- emoji-friendly layout
`;

    const text = await callGemini(prompt, "gemini-2.5-flash");
    res.json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
