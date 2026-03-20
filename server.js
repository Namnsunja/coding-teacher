import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Micromind API running");
});

app.post("/api/ask", async (req, res) => {
  const { mode, message } = req.body;

  try {
    // 💬 DeepSeek — Chat & Coding
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
      return res.json({ reply: data.choices[0].message.content });
    }

    // 🎨 Gemini — Visual & Notes
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
        reply: data.candidates[0].content.parts[0].text
      });
    }

    res.status(400).json({ error: "Invalid mode" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
