const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const db = require("../config/db");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "uploads", "support");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({ storage });

async function ensureSupportSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      user_role VARCHAR(40) NOT NULL,
      user_name VARCHAR(150) NOT NULL,
      user_email VARCHAR(150) NOT NULL,
      user_phone VARCHAR(40) DEFAULT NULL,
      subject VARCHAR(255) NOT NULL DEFAULT 'Support Chat',
      status VARCHAR(40) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS support_chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NULL,
      sender_role VARCHAR(40) NOT NULL,
      sender_name VARCHAR(150) NOT NULL,
      message TEXT DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getOrCreateConversation(user) {
  await ensureSupportSchema();

  const [existing] = await db.query(
    "SELECT * FROM support_conversations WHERE user_id = ? ORDER BY id DESC LIMIT 1",
    [user.id]
  );

  if (existing.length > 0) return existing[0];

  const [result] = await db.query(
    `INSERT INTO support_conversations
     (user_id, user_role, user_name, user_email, user_phone, subject, status)
     VALUES (?, ?, ?, ?, ?, 'Support Chat', 'open')`,
    [user.id, user.role, user.name, user.email, user.phone || null]
  );

  const [created] = await db.query("SELECT * FROM support_conversations WHERE id = ?", [result.insertId]);
  return created[0];
}

router.get("/messages", requireAuth, async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(req.user);

    const [messages] = await db.query(
      "SELECT * FROM support_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversation.id]
    );

    res.json({ success: true, conversation, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load chat.", error: error.sqlMessage || error.message });
  }
});

router.post("/messages", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(req.user);
    const text = req.body.message || "";
    const imageUrl = req.file ? `/uploads/support/${req.file.filename}` : null;

    if (!text.trim() && !imageUrl) {
      return res.status(400).json({ success: false, message: "Message or image is required." });
    }

    await db.query(
      `INSERT INTO support_chat_messages
       (conversation_id, sender_id, sender_role, sender_name, message, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [conversation.id, req.user.id, req.user.role, req.user.name, text, imageUrl]
    );

    await db.query("UPDATE support_conversations SET status='open' WHERE id=?", [conversation.id]);

    res.status(201).json({ success: true, message: "Message sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message.", error: error.sqlMessage || error.message });
  }
});

router.get("/admin/conversations", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    await ensureSupportSchema();

    const [conversations] = await db.query(`
      SELECT
        c.*,
        (
          SELECT message
          FROM support_chat_messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.id DESC
          LIMIT 1
        ) AS last_message
      FROM support_conversations c
      ORDER BY c.updated_at DESC, c.id DESC
    `);

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load conversations.", error: error.sqlMessage || error.message });
  }
});

router.get("/admin/conversations/:id/messages", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [messages] = await db.query(
      "SELECT * FROM support_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [req.params.id]
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load messages.", error: error.sqlMessage || error.message });
  }
});

router.post("/admin/conversations/:id/messages", requireAuth, requireRole("admin"), upload.single("image"), async (req, res) => {
  try {
    const text = req.body.message || "";
    const imageUrl = req.file ? `/uploads/support/${req.file.filename}` : null;

    if (!text.trim() && !imageUrl) {
      return res.status(400).json({ success: false, message: "Message or image is required." });
    }

    await db.query(
      `INSERT INTO support_chat_messages
       (conversation_id, sender_id, sender_role, sender_name, message, image_url)
       VALUES (?, ?, 'admin', ?, ?, ?)`,
      [req.params.id, req.user.id, req.user.name || "Admin", text, imageUrl]
    );

    await db.query("UPDATE support_conversations SET status='replied' WHERE id=?", [req.params.id]);

    res.status(201).json({ success: true, message: "Reply sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send reply.", error: error.sqlMessage || error.message });
  }
});

router.patch("/admin/conversations/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    await db.query("UPDATE support_conversations SET status=? WHERE id=?", [req.body.status || "resolved", req.params.id]);
    res.json({ success: true, message: "Conversation updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update conversation.", error: error.sqlMessage || error.message });
  }
});

module.exports = router;
