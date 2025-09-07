const express = require("express");
const router = express.Router();
const DataInvestor = require("../models/DataInvestor");
const { authenticateToken } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Storage config for lampiran uploads (admin only)
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const LAMPIRAN_BASE_DIR = path.join(__dirname, "../uploads/data-investor/lapiran");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const investorId = req.params.id;
    const dest = path.join(LAMPIRAN_BASE_DIR, String(investorId));
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = crypto.randomBytes(16).toString('hex');
    cb(null, base + ext.toLowerCase());
  }
});

// Multer instance & mime whitelist harus dideklarasikan sebelum dipakai di route
const allowedMimes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
  limits: { fileSize: 20 * 1024 * 1024, files: 10 }
});

// Storage untuk create-with-attachments (ID belum ada, taruh ke temp dulu)
const TEMP_DIR = path.join(LAMPIRAN_BASE_DIR, "tmp");
ensureDir(TEMP_DIR);
const createStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(TEMP_DIR);
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = crypto.randomBytes(16).toString('hex');
    cb(null, base + ext.toLowerCase());
  }
});
const uploadCreate = multer({
  storage: createStorage,
  fileFilter: (req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
  limits: { fileSize: 20 * 1024 * 1024, files: 10 }
});

// ===================== Lampiran (Admin only) =====================
// Upload multiple files
router.post("/:id/lampiran", authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }
    const { id } = req.params;
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    const existing = await DataInvestor.getLampiran(id);
    const now = new Date().toISOString();
    for (const f of files) {
      const meta = {
        url: `/uploads/data-investor/lapiran/${id}/${f.filename}`,
        name: f.originalname,
        mime: f.mimetype,
        size: f.size,
        stored_name: f.filename,
        uploaded_at: now
      };
      existing.push(meta);
    }
    await DataInvestor.setLampiranArray(id, existing);
    res.json({ success: true, data: existing });
  } catch (error) {
    console.error("Error uploading lampiran:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
});

// List lampiran
router.get("/:id/lampiran", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }
    const { id } = req.params;
    const data = await DataInvestor.getLampiran(id);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error listing lampiran:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete one lampiran by stored_name
router.delete("/:id/lampiran", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }
    const { id } = req.params;
    const { stored_name } = req.body || {};
    if (!stored_name) {
      return res.status(400).json({ success: false, message: "stored_name is required" });
    }
    const list = await DataInvestor.getLampiran(id);
    const idx = list.findIndex(it => it && it.stored_name === stored_name);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }
    // remove file on disk
    const filePath = path.join(__dirname, `../uploads/data-investor/lapiran/${id}/${stored_name}`);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    // remove from array
    list.splice(idx, 1);
    await DataInvestor.setLampiranArray(id, list);
    res.json({ success: true, data: list });
  } catch (error) {
    console.error("Error deleting lampiran:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Get all investors
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const investors = await DataInvestor.getAllInvestors();
    
    res.json({
      success: true,
      data: investors,
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get investors by tipe
router.get("/tipe/:tipe", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { tipe } = req.params;
    const investors = await DataInvestor.getInvestorsByTipe(tipe);
    
    res.json({
      success: true,
      data: investors,
    });
  } catch (error) {
    console.error("Error fetching investors by tipe:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get investors by outlet
router.get("/outlet/:outlet", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { outlet } = req.params;
    const investors = await DataInvestor.getInvestorsByOutlet(outlet);
    
    res.json({
      success: true,
      data: investors,
    });
  } catch (error) {
    console.error("Error fetching investors by outlet:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get unique outlets
router.get("/outlets", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const outlets = await DataInvestor.getUniqueOutlets();
    
    res.json({
      success: true,
      data: outlets,
    });
  } catch (error) {
    console.error("Error fetching outlets:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get investor by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { id } = req.params;
    const investor = await DataInvestor.getInvestorById(id);
    
    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found",
      });
    }
    
    res.json({
      success: true,
      data: investor,
    });
  } catch (error) {
    console.error("Error fetching investor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Create new investor
router.post("/", authenticateToken, uploadCreate.any(), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    // Ambil field dari body (multipart/form-data atau JSON)
    const body = req.body || {};
    const {
      outlet,
      nama_investor,
      ttl_investor,
      no_hp,
      alamat,
      tanggal_join,
      kontak_darurat,
      nama_pasangan,
      nama_anak,
      ahli_waris,
      investasi_di_outlet,
      persentase_bagi_hasil,
      tipe_data,
    } = body;

    if (!outlet || !nama_investor) {
      return res.status(400).json({
        success: false,
        message: "Outlet and nama investor are required",
      });
    }

    // Buat investor dulu
    const investorId = await DataInvestor.createInvestor({
      outlet,
      nama_investor,
      ttl_investor,
      no_hp,
      alamat,
      tanggal_join,
      kontak_darurat,
      nama_pasangan,
      nama_anak,
      ahli_waris,
      investasi_di_outlet,
      persentase_bagi_hasil,
      tipe_data,
      created_by: req.user.id
    });

    // Jika ada files (multipart), pindahkan dari temp dan simpan metadata ke kolom lampiran
    const files = req.files || [];
    if (files.length) {
      const finalDir = path.join(LAMPIRAN_BASE_DIR, String(investorId));
      ensureDir(finalDir);
      const now = new Date().toISOString();
      const existing = await DataInvestor.getLampiran(investorId);
      for (const f of files) {
        const finalPath = path.join(finalDir, f.filename);
        const tempPath = f.path;
        try {
          fs.renameSync(tempPath, finalPath);
        } catch (e) {
          fs.copyFileSync(tempPath, finalPath);
          try { fs.unlinkSync(tempPath); } catch {}
        }
        existing.push({
          url: `/uploads/data-investor/lapiran/${investorId}/${f.filename}`,
          name: f.originalname,
          mime: f.mimetype,
          size: f.size,
          stored_name: f.filename,
          uploaded_at: now
        });
      }
      await DataInvestor.setLampiranArray(investorId, existing);
    }

    res.status(201).json({
      success: true,
      message: files.length ? "Investor created with attachments" : "Investor created successfully",
      data: { id: investorId },
    });
  } catch (error) {
    console.error("Error creating investor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update investor
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { id } = req.params;
    const {
      outlet,
      nama_investor,
      ttl_investor,
      no_hp,
      alamat,
      tanggal_join,
      kontak_darurat,
      nama_pasangan,
      nama_anak,
      ahli_waris,
      lampiran,
      investasi_di_outlet,
      persentase_bagi_hasil,
      tipe_data,
    } = req.body;

    if (!outlet || !nama_investor) {
      return res.status(400).json({
        success: false,
        message: "Outlet and nama investor are required",
      });
    }

    const updated = await DataInvestor.updateInvestor(id, {
      outlet,
      nama_investor,
      ttl_investor,
      no_hp,
      alamat,
      tanggal_join,
      kontak_darurat,
      nama_pasangan,
      nama_anak,
      ahli_waris,
      lampiran: typeof lampiran === 'string' ? lampiran : (lampiran ? JSON.stringify(lampiran) : null),
      investasi_di_outlet,
      persentase_bagi_hasil,
      tipe_data,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Investor not found",
      });
    }

    res.json({
      success: true,
      message: "Investor updated successfully",
    });
  } catch (error) {
    console.error("Error updating investor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete investor
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { id } = req.params;
    const deleted = await DataInvestor.deleteInvestor(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Investor not found",
      });
    }

    res.json({
      success: true,
      message: "Investor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting investor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
