import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Render provides the PORT automatically
const PORT = process.env.PORT || 10000;

// This will grab the key from Render's Environment Variables dashboard
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Gemini failed");
  return data?.candidates?.?.content?.parts?.?.text || "No reply";
}

app.get("/", (req, res) => res.json({ status: "Server is Live 🚀" }));

app.post("/api/ask", async (req, res) => {
  try {
    const { mode, message, topic } = req.body;
    const input = message || topic;
    if (!mode || !input) return res.status(400).json({ error: "Missing mode or input" });

    let prompt = `Teacher Mode: ${mode}. Topic: ${input}. Keep it short and helpful.`;
    const reply = await callGemini(prompt);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server on 0.0.0.0 (required for Render)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
