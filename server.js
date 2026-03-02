const express = require("express");
const initSqlJs = require("sql.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "recipes.db");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOADS_DIR));

let db;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper: run a SELECT and return array of row objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// Delete uploaded file from disk if it's a local upload
function deleteUploadedFile(pdfLink) {
  if (pdfLink && pdfLink.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, pdfLink);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

async function main() {
  const SQL = await initSqlJs();

  // Load existing DB file or create a new one
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_name TEXT NOT NULL,
      cook_time_minutes INTEGER NOT NULL,
      pdf_link TEXT NOT NULL
    )
  `);

  // Seed sample recipes if the table is empty
  const countRow = queryOne("SELECT COUNT(*) AS cnt FROM recipes");
  if (countRow.cnt === 0) {
    const samples = [
      ["Spaghetti Bolognese", 45, "https://example.com/spaghetti-bolognese.pdf"],
      ["Chicken Stir Fry", 25, "https://example.com/chicken-stir-fry.pdf"],
      ["Beef Tacos", 30, "https://example.com/beef-tacos.pdf"],
      ["Vegetable Curry", 35, "https://example.com/vegetable-curry.pdf"],
      ["Grilled Salmon", 20, "https://example.com/grilled-salmon.pdf"],
    ];
    for (const [name, time, link] of samples) {
      db.run(
        "INSERT INTO recipes (recipe_name, cook_time_minutes, pdf_link) VALUES (?, ?, ?)",
        [name, time, link]
      );
    }
  }
  saveDb();

  // --- API routes ---

  // Get all recipes
  app.get("/api/recipes", (_req, res) => {
    res.json(queryAll("SELECT * FROM recipes ORDER BY id"));
  });

  // Get one recipe
  app.get("/api/recipes/:id", (req, res) => {
    const row = queryOne("SELECT * FROM recipes WHERE id = ?", [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: "Recipe not found" });
    res.json(row);
  });

  // Create recipe
  app.post("/api/recipes", upload.single("pdf"), (req, res) => {
    const { recipe_name, cook_time_minutes } = req.body;
    if (!recipe_name || cook_time_minutes == null || !req.file) {
      return res.status(400).json({ error: "All fields are required (including a PDF file)" });
    }
    const pdf_link = "/uploads/" + req.file.filename;
    db.run(
      "INSERT INTO recipes (recipe_name, cook_time_minutes, pdf_link) VALUES (?, ?, ?)",
      [recipe_name, Number(cook_time_minutes), pdf_link]
    );
    const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    saveDb();
    res.status(201).json({ id, recipe_name, cook_time_minutes: Number(cook_time_minutes), pdf_link });
  });

  // Update recipe
  app.put("/api/recipes/:id", upload.single("pdf"), (req, res) => {
    const { recipe_name, cook_time_minutes } = req.body;
    if (!recipe_name || cook_time_minutes == null) {
      return res.status(400).json({ error: "Recipe name and cook time are required" });
    }

    const existing = queryOne("SELECT * FROM recipes WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Recipe not found" });

    let pdf_link = existing.pdf_link;
    if (req.file) {
      // Delete old uploaded file if it was a local upload
      deleteUploadedFile(existing.pdf_link);
      pdf_link = "/uploads/" + req.file.filename;
    }

    db.run(
      "UPDATE recipes SET recipe_name = ?, cook_time_minutes = ?, pdf_link = ? WHERE id = ?",
      [recipe_name, Number(cook_time_minutes), pdf_link, Number(req.params.id)]
    );
    saveDb();
    res.json({ id: Number(req.params.id), recipe_name, cook_time_minutes: Number(cook_time_minutes), pdf_link });
  });

  // Delete recipe
  app.delete("/api/recipes/:id", (req, res) => {
    const existing = queryOne("SELECT * FROM recipes WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Recipe not found" });

    // Delete uploaded file from disk
    deleteUploadedFile(existing.pdf_link);

    db.run("DELETE FROM recipes WHERE id = ?", [Number(req.params.id)]);
    saveDb();
    res.json({ success: true });
  });

  // Get random recipe
  app.get("/api/recipes-random", (_req, res) => {
    const row = queryOne("SELECT * FROM recipes ORDER BY RANDOM() LIMIT 1");
    if (!row) return res.status(404).json({ error: "No recipes available" });
    res.json(row);
  });

  // --- Start server ---
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
