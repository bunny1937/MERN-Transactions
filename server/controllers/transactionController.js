// server/controllers/transactionController.js

const axios = require("axios");
const Transaction = require("../models/Transaction");

const seedDatabase = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );

    const transactionsToInsert = data.map((item) => ({
      productid: item.id,
      productTitle: item.title,
      productDescription: item.description,
      price: item.price,
      category: item.category,
      sold: item.sold,
      image: item.image,
      dateOfSale: new Date(item.dateOfSale),
    }));

    await Transaction.insertMany(transactionsToInsert);
    res.status(200).json({ message: "Database seeded successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getTransactions = async (req, res) => {
  try {
    const { month, search = "", page = 1, perPage = 10 } = req.query;

    // Pagination
    const itemsPerPage = parseInt(perPage);
    const skipItems = (parseInt(page) - 1) * itemsPerPage;

    // Search filter logic
    let searchFilter = {};
    if (search.trim() !== "") {
      searchFilter = {
        $or: [
          { productTitle: { $regex: search, $options: "i" } },
          { productDescription: { $regex: search, $options: "i" } },
        ],
      };

      if (!isNaN(search)) {
        searchFilter.$or.push({ price: parseFloat(search) });
      }
    }

    // Month filter (apply only if no search query is provided)
    let monthFilter = {};
    if (search.trim() === "" && month) {
      const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
      monthFilter = {
        $expr: {
          $eq: [{ $month: "$dateOfSale" }, monthNumber],
        },
      };
    }

    // Combine the filters (either search or month, or both)
    const filter = { ...monthFilter, ...searchFilter };

    // Get total count of matching transactions
    const totalTransactions = await Transaction.countDocuments(filter);

    // Fetch filtered transactions with pagination
    const transactions = await Transaction.find(filter)
      .skip(skipItems)
      .limit(itemsPerPage);

    res.status(200).json({
      totalTransactions,
      transactions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalTransactions / itemsPerPage),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getMonthlyStatistics = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    // Convert the month name (e.g., "January") to the corresponding month number (1-12)
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

    // Filter for the selected month
    const monthFilter = {
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNumber],
      },
    };

    // Aggregation pipeline for the statistics
    const statistics = await Transaction.aggregate([
      {
        $match: monthFilter, // Match transactions in the selected month
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: {
            $sum: {
              $cond: [{ $eq: ["$sold", true] }, "$price", 0], // Sum the price of sold items
            },
          },
          totalSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] }, // Count the number of sold items
          },
          totalNotSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] }, // Count the number of not sold items
          },
        },
      },
    ]);

    // Return the statistics
    res.status(200).json({
      totalSaleAmount: statistics[0]?.totalSaleAmount || 0,
      totalSoldItems: statistics[0]?.totalSoldItems || 0,
      totalNotSoldItems: statistics[0]?.totalNotSoldItems || 0,
    });
  } catch (error) {
    console.error("Error fetching monthly statistics:", error.message);
    res.status(500).json({ message: error.message });
  }
};


const getCombinedData = async (req, res) => {
  try {
    const statistics = await getStatistics(req, res);
    res.status(200).json({
      statistics: statistics.data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  seedDatabase,
  getMonthlyStatistics,
  getTransactions,
  getCombinedData,
};
