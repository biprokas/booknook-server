
const { ObjectId } = require("mongodb");
const { getDB, client } = require("../config/db");

// Borrow a book
const borrowBook = async (req, res) => {
  const { bookId, returnDate } = req.body;
  const userEmail = req.user.email;

  if (!ObjectId.isValid(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  const parsedReturnDate = new Date(returnDate);

  if (
    !returnDate ||
    Number.isNaN(parsedReturnDate.getTime()) ||
    parsedReturnDate <= new Date()
  ) {
    return res.status(400).json({
      message: "Please provide a valid future return date",
    });
  }

  const session = client.startSession();

  try {
    const db = getDB();
    const booksCollection = db.collection("books");
    const borrowsCollection = db.collection("borrows");

    await session.withTransaction(async () => {
      const book = await booksCollection.findOne(
        { _id: new ObjectId(bookId) },
        { session }
      );

      if (!book) {
        const error = new Error("Book not found");
        error.statusCode = 404;
        throw error;
      }

      const existingBorrow = await borrowsCollection.findOne(
        {
          bookId: new ObjectId(bookId),
          userEmail,
        },
        { session }
      );

      if (existingBorrow) {
        const error = new Error("You have already borrowed this book");
        error.statusCode = 409;
        throw error;
      }

      const updateResult = await booksCollection.updateOne(
        {
          _id: new ObjectId(bookId),
          availableCopies: { $gt: 0 },
        },
        {
          $inc: { availableCopies: -1 },
        },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        const error = new Error("This book is currently unavailable");
        error.statusCode = 400;
        throw error;
      }

      await borrowsCollection.insertOne(
        {
          bookId: new ObjectId(bookId),
          bookTitle: book.title,
          bookImage: book.image,
          userEmail,
          borrowDate: new Date(),
          returnDate: parsedReturnDate,
        },
        { session }
      );
    });

    res.status(201).json({
      message: "Book borrowed successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// Get current user's borrowed books
const getMyBorrows = async (req, res) => {
  try {
    const db = getDB();

    const borrows = await db
      .collection("borrows")
      .find({ userEmail: req.user.email })
      .sort({ borrowDate: -1 })
      .toArray();

    res.status(200).json(borrows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return a borrowed book
const returnBook = async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid borrow ID" });
  }

  const session = client.startSession();

  try {
    const db = getDB();
    const borrowsCollection = db.collection("borrows");
    const booksCollection = db.collection("books");

    await session.withTransaction(async () => {
      const borrow = await borrowsCollection.findOne(
        {
          _id: new ObjectId(id),
          userEmail: req.user.email,
        },
        { session }
      );

      if (!borrow) {
        const error = new Error("Borrow record not found");
        error.statusCode = 404;
        throw error;
      }

      const deleteResult = await borrowsCollection.deleteOne(
        {
          _id: new ObjectId(id),
          userEmail: req.user.email,
        },
        { session }
      );

      if (deleteResult.deletedCount === 0) {
        const error = new Error("Borrow record already returned");
        error.statusCode = 404;
        throw error;
      }

      const updateResult = await booksCollection.updateOne(
        { _id: borrow.bookId },
        { $inc: { availableCopies: 1 } },
        { session }
      );

      if (updateResult.matchedCount === 0) {
        throw new Error("The original book could not be found");
      }
    });

    res.status(200).json({
      message: "Book returned successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  borrowBook,
  getMyBorrows,
  returnBook,
};
