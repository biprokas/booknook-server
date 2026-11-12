const express = require("express");
const router = express.Router();

const {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getMyBooks,
} = require("../controllers/bookController");

const verifyToken = require("../middleware/verifyToken");

// Public route
router.get("/", getAllBooks);
// Get books added by the logged-in user
router.get("/my-books", verifyToken, getMyBooks);
// Protected routes
router.get("/:id", verifyToken, getBookById);
router.post("/", verifyToken, addBook);
router.patch("/:id", verifyToken, updateBook);
router.delete("/:id", verifyToken, deleteBook);

module.exports = router;
