const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// Run Python code
app.post("/run", (req, res) => {
  const code = req.body.code;

  fs.writeFileSync("temp.py", code);

  exec("python temp.py", (error, stdout, stderr) => {
    if (error) {
      return res.json({ output: stderr });
    }
    if (stderr) {
      return res.json({ output: stderr });
    }
    res.json({ output: stdout });
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
