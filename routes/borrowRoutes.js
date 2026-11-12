
const express = require("express");
const router = express.Router();

const {
  borrowBook,
  getMyBorrows,
  returnBook,
} = require("../controllers/borrowController");

const verifyToken = require("../middleware/verifyToken");

// All borrow routes require authentication
router.post("/", verifyToken, borrowBook);
router.get("/", verifyToken, getMyBorrows);
router.delete("/:id", verifyToken, returnBook);

module.exports = router;
