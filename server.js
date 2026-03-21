import express from "express";
import cors from "cors";

// Node 18+ supports fetch natively
// If using older Node, uncomment the next line
// import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Render provides the PORT automatically
const PORT = process.env.PORT || 10000;

// Environment variable from Render
const GEMINI_API_KEY = process.env.AIzaSyDtSEeKs_e5uHjTRQDnCd0FLVAlOw2gZIU;
const GEMINI_MODEL = "gemini-1.5-flash";

// Function to call Gemini API
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: {
        text: prompt
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", data);
    throw new Error(data?.error?.message || "Gemini API call failed");
  }

  // Safely extract text from response
  const text =
    data?.candidates?.[0]?.content?.[0]?.text ||
    "Gemini replied but no text found.";

  return text;
}

// Health check route
app.get("/", (req, res) => res.json({ status: "Server is Live 🚀" }));

// API route
app.post("/api/ask", async (req, res) => {
  try {
    const { mode, message, topic } = req.body;
    const input = message || topic;

    if (!mode || !input) {
      return res.status(400).json({ error: "Missing mode or input" });
    }

    const prompt = `Teacher Mode: ${mode}. Topic: ${input}. Keep it short and helpful.`;
    const reply = await callGemini(prompt);

    res.json({ reply });
  } catch (err) {
    console.error("Error in /api/ask:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server on 0.0.0.0 (required for Render)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
