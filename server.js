import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Micromind API running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/test", (req, res) => {
  res.status(200).send("Test OK");
});

app.post("/api/ask", async (req, res) => {
  const message = req.body.message || "";
  const mode = (req.body.mode || "").toLowerCase().trim();

  try {
    // 💬 CHAT + CODE
    if (mode === "chat" || mode === "code") {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: message }]
        })
      });

      const data = await response.json();
      return res.json({
        reply: data.choices?.[0]?.message?.content || "No reply from DeepSeek"
      });
    }

    // 🎨 VISUAL
    if (mode === "visual") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
          })
        }
      );

      const data = await response.json();
      return res.json({
        reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from Gemini"
      });
    }

    // ❌ Invalid mode
    return res.status(400).json({
      error: "Invalid mode",
      allowed: ["chat", "code", "visual"],
      received: mode || "empty"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
