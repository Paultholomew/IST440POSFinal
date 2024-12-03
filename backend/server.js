const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Mock database for tables
let tables = [];

// POST /tables - Add a new table
app.post("/tables", (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Table name is required" });
  }

  const newTable = {
    id: Date.now(),
    name,
    status: "Available",
    timer: null,
    timerStart: null,
    notes: "",
    orders: [],
  };

  tables.push(newTable); // Add table to the mock database
  res.status(201).json(newTable); // Return the newly created table
});

// GET /tables - Get all tables
app.get("/tables", (req, res) => {
  res.json(tables);
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
