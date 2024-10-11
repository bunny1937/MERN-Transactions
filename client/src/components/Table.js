import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import "./Table.css";

const TransactionTable = () => {
  const [data, setData] = useState([]); // Transaction data
  const [currentPage, setCurrentPage] = useState(0); // Current page
  const [selectedMonth, setSelectedMonth] = useState("March"); // Default to March
  const [searchText, setSearchText] = useState(""); // Search query
  const [totalRecords, setTotalRecords] = useState(0); // Total number of filtered records from the API
  const [statistics, setStatistics] = useState({
    totalSales: 0,
    totalSoldItems: 0,
    totalNotSoldItems: 0,
  }); // Store statistics for the selected month
  const [loadingStats, setLoadingStats] = useState(false); // Loading state for statistics

  const itemsPerPage = 10; // Number of items per page

  // Fetch transactions when the page, search, or month changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/transactions`, {
          params: {
            search: searchText,
            month: selectedMonth,
            page: currentPage + 1, // API expects 1-based index
            perPage: itemsPerPage,
          },
        });

        // Log the API response for debugging
        console.log("API Response:", response.data);

        // Set the transaction data and total records from the API
        setData(response.data.transactions);
        setTotalRecords(response.data.totalTransactions); // Set the total number of records
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [currentPage, searchText, selectedMonth]);

  // Fetch statistics for the selected month
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoadingStats(true);
        const response = await axios.get(
          `http://localhost:5000/statistics?month=${selectedMonth}`
        );

        // Assuming the response contains { totalSales, totalSoldItems, totalNotSoldItems }
        setStatistics(response.data); // Set statistics data
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoadingStats(false); // Stop loading
      }
    };

    fetchStatistics();
  }, [selectedMonth]);
  const calculateTotal = (items) => {
    return items.reduce((acc, item) => acc + item.price, 0);
  };
  // Function to highlight search terms in text
  const highlightText = (text, searchText) => {
    if (!searchText) return text;

    // Create a regular expression for the search text (case-insensitive)
    const regex = new RegExp(`(${searchText})`, "gi");

    // Split the text into parts, wrapping matches in a <span> with a highlight class
    const parts = text.toString().split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === searchText.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Handle month change
  const handleMonthChange = (e) => {
    setCurrentPage(0); // Reset to the first page when the month changes
    setSelectedMonth(e.target.value);
  };

  // Handle search text change
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    setCurrentPage(0); // Reset to first page on search
  };

  // Handle page click
  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  // Define total pages based on the total records and itemsPerPage
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  return (
    <div className="Table-box">
      <h2>Transaction List</h2>
      <div className="filter-elements">
        {/* Search box */}
        <input
          type="text"
          className="search-button"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search by Title, Description, or Price"
        />

        {/* Month selection dropdown */}
        <select
          className="month-dropdown"
          value={selectedMonth}
          onChange={handleMonthChange}
        >
          {[
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ].map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Price</th>
            <th>Description</th>
            <th>Category</th>
            <th>Sold</th>
            <th>Image</th>
            <th>Date of Sale</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item._id}>
              <td>{item.productid}</td>
              <td>{highlightText(item.productTitle, searchText)}</td>
              <td>{highlightText(`${item.price}`, searchText)}</td>
              <td>{highlightText(item.productDescription, searchText)}</td>
              <td>{item.category}</td>
              <td>{item.sold ? "Yes" : "No"}</td>
              <td>
                <img
                  src={item.image}
                  alt={item.productTitle}
                  style={{ width: "50px" }}
                />
              </td>
              <td>{item.dateOfSale}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Custom Pagination Layout */}
      <div className="custom-pagination">
        <div className="left-page">
          {/* Display current page on the left */}
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
        </div>

        <div className="middle-buttons">
          <ReactPaginate
            previousLabel={"← Previous"}
            nextLabel={"Next →"}
            pageCount={totalPages}
            onPageChange={handlePageClick}
            containerClassName={"pagination"}
            previousLinkClassName={"prev-button"}
            nextLinkClassName={"next-button"}
            activeClassName={"active"}
            pageClassName={"hidden"} // Hides the page numbers
            breakClassName={"hidden"} // Hides the break label (...)
            pageRangeDisplayed={0} // No page numbers displayed
            marginPagesDisplayed={0} // No margin pages
            renderOnZeroPageCount={null}
          />
        </div>

        <div className="right-info">
          {/* Display current range on the right */}
          <span>
            Items {currentPage * itemsPerPage + 1} to{" "}
            {currentPage * itemsPerPage + data.length} of {totalRecords}
          </span>
        </div>
      </div>

      {/* Statistics section */}
      <div className="statistics-container">
        <h2>
          Statistics - {selectedMonth}
          <span className="selected-month"></span>
        </h2>
        {loadingStats ? ( // Show loading indicator if stats are loading
          <p>Loading statistics...</p>
        ) : (
          <div className="stat-box">
            <div className="stat-item">
              <h3>Total Sale</h3>
              <p>${statistics.totalSales || 0}</p>
            </div>
            <div className="stat-item">
              <h3>Total Sold Items</h3>
              <p>{statistics.totalSoldItems || 0}</p>
            </div>
            <div className="stat-item">
              <h3>Total Not Sold Items</h3>
              <p>{statistics.totalNotSoldItems || 0}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
