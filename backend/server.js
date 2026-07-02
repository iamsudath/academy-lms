import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "LMS API Running Clean V2" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

import { pool } from "./db.js";

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "DB Connected Successfully",
      time: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      message: "DB Connection Failed",
      error: err.message
    });
  }
});
