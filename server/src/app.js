import cors from "cors";
import express from "express";

import booksRouter from "./routes/books.js";
import { checkGoogleBooks } from "./services/books.js";
import creaturesRouter from "./routes/creatures.js";
import demoAuthRouter from "./routes/demoAuth.js";
import friendsRouter from "./routes/friends.js";
import nearbyRouter from "./routes/nearby.js";
import peopleRouter from "./routes/people.js";
import messagesRouter from "./routes/messages.js";
import quoteRouter from "./routes/quote.js";
import recommendationsRouter from "./routes/recommendations.js";
import notificationsRouter from "./routes/notifications.js";
import roomFurnitureRouter from "./routes/roomFurniture.js";
import roomNotesRouter from "./routes/roomNotes.js";
import savedQuotesRouter from "./routes/savedQuotes.js";
import scanBookRouter from "./routes/scanBook.js";
import storesRouter from "./routes/stores.js";
import timeRouter from "./routes/time.js";
import userBooksRouter from "./routes/userBooks.js";
import weatherRouter from "./routes/weather.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", async (req, res) => {
  // ?deep=1 also tests Google Books (see checkGoogleBooks)
  if (!req.query.deep) return res.json({ ok: true });
  res.json({ ok: true, googleBooks: await checkGoogleBooks() });
});

app.use("/api/books", booksRouter);
app.use("/api/user-books", userBooksRouter);
app.use("/api/quote", quoteRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/time", timeRouter);
app.use("/api/creatures", creaturesRouter);
app.use("/api/demo-auth", demoAuthRouter);
app.use("/api/people", peopleRouter);
app.use("/api/nearby", nearbyRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/stores", storesRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/rooms/:readerId/notes", roomNotesRouter);
app.use("/api/rooms/:readerId/furniture", roomFurnitureRouter);
app.use("/api/saved-quotes", savedQuotesRouter);
app.use("/api/scan-book", scanBookRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});
