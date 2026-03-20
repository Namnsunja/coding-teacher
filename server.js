const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 🎮 Duolingo-style lesson
app.post("/lesson", (req, res) => {
  const { message } = req.body;

  let response = {
    emotion: "happy",
    question: "What is a variable in JavaScript?",
    hint: "It stores data",
    correct_answer: "a container to store data"
  };

  res.json(response);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running");
});
