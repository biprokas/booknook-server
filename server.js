
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB, getDB } = require("./config/db");

const imageRoutes = require("./routes/imageRoutes");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");

const app = express();

app.use(
  cors({
   origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/books", bookRoutes);
app.use("/borrows", borrowRoutes);
app.use("/images", imageRoutes);

app.get("/", (req, res) => {
  res.send("BookNook server is running!");
});

const startServer = async () => {
  try {
    await connectDB();

    // Prevent duplicate active borrows by the same user
    await getDB()
      .collection("borrows")
      .createIndex(
        { bookId: 1, userEmail: 1 },
        {
          unique: true,
          name: "unique_user_book_borrow",
        }
      );

    console.log("Borrow index created successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
