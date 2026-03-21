import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* 🔑 PUT YOUR GEMINI KEY HERE */
const GEMINI_API_KEY = "AIzaSyDtSEeKs_e5uHjTRQDnCd0FLVAlOw2gZIU";
const MODEL = "gemini-1.5-flash";

/* 🧠 Simple usage limiter (per server run) */
let requestCount = 0;
const MAX_REQUESTS = 50;

function checkLimit(res) {
  requestCount++;
  if (requestCount > MAX_REQUESTS) {
    res.status(429).json({
      error: "Limit reached. Try again later."
    });
    return false;
  }
  return true;
}

/* 🔥 Gemini function */
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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
      ]
    })
  });

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

/* 🌐 Routes */

app.get("/", (req, res) => {
  res.send("Micromind AI running 🚀");
});

/* 💬 CHAT */
app.post("/chat", async (req, res) => {
  if (!checkLimit(res)) return;

  const message = req.body.message;

  const prompt = `
You are a friendly AI teacher.
Reply in a simple, helpful, slightly fun way.

User: ${message}
`;

  const reply = await callGemini(prompt);
  res.json({ reply });
});

/* 💻 CODING TEACHER (DUOLINGO STYLE) */
app.post("/coding", async (req, res) => {
  if (!checkLimit(res)) return;

  const message = req.body.message;

  const prompt = `
You are a fun coding teacher like Duolingo.

Teach this topic step by step:
${message}

Make it:
- very easy
- fun
- short
- include 1 mini quiz
`;

  const reply = await callGemini(prompt);
  res.json({ reply });
});

/* 📝 NOTES */
app.post("/notes", async (req, res) => {
  if (!checkLimit(res)) return;

  const topic = req.body.topic;

  const prompt = `
Create exam notes for: ${topic}

Include:
- short explanation
- important points
- important questions
- quick revision
`;

  const reply = await callGemini(prompt);
  res.json({ reply });
});

/* 🎨 VISUAL */
app.post("/visual", async (req, res) => {
  if (!checkLimit(res)) return;

  const topic = req.body.topic;

  const prompt = `
Create a visual study card for: ${topic}

Include:
- title
- main idea
- 3 bullets
- memory trick
`;

  const reply = await callGemini(prompt);
  res.json({ reply });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on " + PORT);
});
