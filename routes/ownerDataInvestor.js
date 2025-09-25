const express = require("express");
const router = express.Router();
const DataInvestor = require("../models/DataInvestor");
const { authenticateToken } = require("../middleware/auth");

// ===================== Owner Data Investor Routes (Read-Only) =====================

// Get all investors (owner read-only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
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

// Get investors by outlet (owner read-only)
router.get("/outlet/:outlet", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
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

// Get unique outlets (owner read-only)
router.get("/outlets", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
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

// Get investor by ID (owner read-only)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
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

// Get lampiran for investor (owner read-only)
router.get("/:id/lampiran", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
      });
    }

    const { id } = req.params;
    const data = await DataInvestor.getLampiran(id);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error listing lampiran:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get investor statistics/summary (owner read-only)
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
      });
    }

    const investors = await DataInvestor.getAllInvestors();
    
    // Calculate basic statistics
    const stats = {
      totalInvestors: investors.length,
      totalInvestment: investors.reduce((sum, inv) => sum + (parseInt(inv.investasi_di_outlet) || 0), 0),
      outletsCount: [...new Set(investors.map(inv => inv.outlet))].length,
      averageInvestment: 0
    };
    
    if (stats.totalInvestors > 0) {
      stats.averageInvestment = Math.round(stats.totalInvestment / stats.totalInvestors);
    }
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching investor stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get outlet summary (owner read-only)
router.get("/outlet-summary", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
      });
    }

    const investors = await DataInvestor.getAllInvestors();
    
    // Group by outlet and calculate summary
    const outletSummary = {};
    investors.forEach(investor => {
      const outlet = investor.outlet;
      if (!outletSummary[outlet]) {
        outletSummary[outlet] = {
          outlet,
          investorCount: 0,
          totalInvestment: 0,
          averageInvestment: 0
        };
      }
      outletSummary[outlet].investorCount++;
      outletSummary[outlet].totalInvestment += parseInt(investor.investasi_di_outlet) || 0;
    });
    
    // Calculate averages
    Object.values(outletSummary).forEach(summary => {
      if (summary.investorCount > 0) {
        summary.averageInvestment = Math.round(summary.totalInvestment / summary.investorCount);
      }
    });
    
    res.json({
      success: true,
      data: Object.values(outletSummary),
    });
  } catch (error) {
    console.error("Error fetching outlet summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;