const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const db = getDB();

    const books = await db
      .collection("books")
      .find()
      .sort({ addedAt: -1 })
      .toArray();

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single book
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const db = getDB();

    const book = await db.collection("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get books added by the logged-in user
const getMyBooks = async (req, res) => {
  try {
    const db = getDB();

    const books = await db
      .collection("books")
      .find({ addedByEmail: req.user.email })
      .sort({ addedAt: -1 })
      .toArray();

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new book
const addBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
      addedByName,
    } = req.body;

    if (
      !title ||
      !author ||
      !category ||
      !image ||
      !description ||
      !addedByName
    ) {
      return res.status(400).json({
        message: "Please provide all required book information",
      });
    }

    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        message: "Total copies must be at least 1",
      });
    }

    const db = getDB();

    const newBook = {
      title,
      author,
      category,
      image,
      description,
      totalCopies: copies,
      availableCopies: copies,
      addedByName,
      addedByEmail: req.user.email,
      addedAt: new Date(),
    };

    const result = await db.collection("books").insertOne(newBook);

    res.status(201).json({
      message: "Book added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const { title, author, category, image, description, totalCopies } =
      req.body;

    const db = getDB();
    const booksCollection = db.collection("books");

    const book = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.addedByEmail !== req.user.email) {
      return res.status(403).json({
        message: "You cannot update someone else's book",
      });
    }

    const updatedData = {};

    if (title !== undefined) updatedData.title = title;
    if (author !== undefined) updatedData.author = author;
    if (category !== undefined) updatedData.category = category;
    if (image !== undefined) updatedData.image = image;
    if (description !== undefined) updatedData.description = description;

    if (totalCopies !== undefined) {
      const copies = Number(totalCopies);
      const borrowedCopies = book.totalCopies - book.availableCopies;

      if (!Number.isInteger(copies) || copies < borrowedCopies) {
        return res.status(400).json({
          message: "Total copies cannot be less than borrowed copies",
        });
      }

      updatedData.totalCopies = copies;
      updatedData.availableCopies = copies - borrowedCopies;
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        message: "No valid information provided to update",
      });
    }

    await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData },
    );

    res.status(200).json({
      message: "Book updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const db = getDB();
    const booksCollection = db.collection("books");

    const book = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.addedByEmail !== req.user.email) {
      return res.status(403).json({
        message: "You cannot delete someone else's book",
      });
    }

    if (book.availableCopies !== book.totalCopies) {
      return res.status(400).json({
        message: "You cannot delete a book while copies are borrowed",
      });
    }

    await booksCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getMyBooks,
};
