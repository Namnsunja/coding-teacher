import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Root
app.get("/", (req, res) => {
  res.json({ message: "Micromind API running ✅" });
});

// Health
app.get("/health", (req, res) => {
  res.json({ status: "ok ✅" });
});

// Test
app.get("/test", (req, res) => {
  res.send("Test working ✅");
});

// MAIN API (WORKING)
app.post("/api/ask", (req, res) => {
  const message = req.body.message || "";
  const mode = (req.body.mode || "").toLowerCase();

  // 🎮 Coding teacher style
  if (mode === "code") {
    return res.json({
      reply: `👨‍🏫 Lesson: ${message}

Step 1: Understand the concept  
Step 2: Example  
Step 3: Practice  

🎯 Quiz: What is a variable?  
💻 Exercise: Create one variable`
    });
  }

  // 💬 Chat
  if (mode === "chat") {
    return res.json({
      reply: `🤖 AI says: ${message}`
    });
  }

  // 🎨 Visual
  if (mode === "visual") {
    return res.json({
      reply: `🎨 Notes for: ${message}

- Short explanation  
- Important points  
- Exam tip ⭐`
    });
  }

  // Default
  return res.json({
    reply: "✅ API working perfectly"
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
