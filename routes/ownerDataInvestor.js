const express = require("express");
const router = express.Router();
const DataInvestor = require("../models/DataInvestor");
const { authenticateToken } = require("../middleware/auth");

// Get all investors
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
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
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
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
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
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
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
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
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
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
router.post("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
      });
    }

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
      lampiran: typeof lampiran === 'string' ? lampiran : (lampiran ? JSON.stringify(lampiran) : null),
      investasi_di_outlet,
      persentase_bagi_hasil,
      tipe_data,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Investor created successfully",
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
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
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
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. owner only.",
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
