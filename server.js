import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 10000;

// Use environment variable for the key
const GEMINI_API_KEY = process.env.AIzaSyDtSEeKs_e5uHjTRQDnCd0FLVAlOw2gZIU;
const GEMINI_MODEL = "gemini-1.5-flash";

/* ---------- GEMINI CALL ---------- */
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini failed");
  }

  return data?.candidates?.?.content?.parts?.?.text || "No reply";
}

/* ---------- ROUTES ---------- */

app.get("/", (req, res) => {
  res.json({ message: "Coding Teacher Server is running 🚀" });
});

app.post("/api/ask", async (req, res) => {
  try {
    const { mode, message, topic } = req.body;

    if (!mode) return res.status(400).json({ error: "Mode required" });
    const input = message || topic || "";
    if (!input) return res.status(400).json({ error: "Message or Topic required" });

    let prompt = "";

    // Mode Logic
    if (mode === "chat") {
      prompt = `You are a friendly teacher. Answer clearly and shortly.\nUser: ${input}`;
    } else if (mode === "code") {
      prompt = `You are a fun coding teacher like Duolingo. Teach simply step-by-step.\nTopic: ${input}\nGive: short explanation, steps, and a small task.`;
    } else if (mode === "notes") {
      prompt = `Make study notes for: ${input}\nInclude: short note, key points, important questions, and exam tips.`;
    } else if (mode === "visual") {
      prompt = `Create a simple visual learning card for: ${input}\nInclude: title, 3 bullet points, and a memory trick.`;
    } else {
      return res.status(400).json({ error: "Invalid mode" });
    }

    const reply = await callGemini(prompt);

    return res.json({ mode, reply });

  } catch (err) {
    console.error("Server Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/* ---------- 404 HANDLER ---------- */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

/* ---------- START SERVER ---------- */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server spinning on port ${PORT}`);
});
