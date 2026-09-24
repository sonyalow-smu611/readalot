import cors from "cors";
import express from "express";

import booksRouter from "./routes/books.js";
import peopleRouter from "./routes/people.js";
import quoteRouter from "./routes/quote.js";
import recommendationsRouter from "./routes/recommendations.js";
import scanBookRouter from "./routes/scanBook.js";
import storesRouter from "./routes/stores.js";
import userBooksRouter from "./routes/userBooks.js";
import usersRouter from "./routes/users.js";
import weatherRouter from "./routes/weather.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/books", booksRouter);
app.use("/api/users", usersRouter);
app.use("/api/user-books", userBooksRouter);
app.use("/api/quote", quoteRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/people", peopleRouter);
app.use("/api/stores", storesRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/scan-book", scanBookRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});
