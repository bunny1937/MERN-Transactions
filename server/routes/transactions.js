// server/routes/transactions.js

const express = require("express");
const {
  seedDatabase,
  getTransactions,
  getCombinedData,
  getMonthlyStatistics,
} = require("../controllers/transactionController");
const router = express.Router();

router.get("/statistics", getMonthlyStatistics);
router.get("/seed", seedDatabase);
router.get("/transactions", getTransactions);
router.get("/combined", getCombinedData);

module.exports = router;
