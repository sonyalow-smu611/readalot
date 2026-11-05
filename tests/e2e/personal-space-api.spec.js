// Scaffolded with AI assistance — see AI_USAGE.md
// Direct API authorization tests for personal-space resources (ticket 03): room furniture, room
// notes, the reader's shelf (user-books), book reviews, saved mood quotes, and reader profiles.
// Each resource is tested against the Supabase-backed API (port 3111) with unauthenticated, owner,
// permitted-visitor, and unrelated-reader outcomes. These tests do not open a browser: they drive
// the Express API directly with authenticated and unauthenticated sessions, verifying HTTP status,
// response shape, ownership scoping, and persisted result.
import { expect, test, REAL_API } from "./fixtures.js";
import { createReader, createPrivateReader, makeFriends, setDiscoverable } from "./supabaseUser.js";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const admin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// --- request helpers --------------------------------------------------------------------------

const api = (path) => `${REAL_API}${path}`;
const auth = (session) => ({ Authorization: `Bearer ${session.access_token}` });

// A valid furniture piece for PUT requests (fields checked by cleanPieces)
const PIECE = { uid: "test-piece-1", id: "poster-moon", zone: "wall", x: 0.5, at: { x: 100, y: 50 } };

// A unique book id for shelf and review tests, so parallel workers never collide
const uniqueBookId = () => `auth-test-${randomUUID()}`;

// Clean a reader's personal-space data directly in Supabase, between tests sharing one reader.
async function cleanSpace(readerId) {
  await admin.from("room_notes").delete().or(`owner_id.eq.${readerId},author_id.eq.${readerId}`);
  await admin.from("room_furniture").delete().eq("owner_id", readerId);
  await admin.from("user_books").delete().eq("user_id", readerId);
  await admin.from("reviews").delete().eq("user_id", readerId);
  await admin.from("saved_mood_quotes").delete().eq("user_id", readerId);
}

// The reader fixture resets profile/friends/daily between tests, but not personal-space data;
// clean it here so each test starts with an empty room, shelf, board and quote list.
test.afterEach(async ({ reader }) => {
  await cleanSpace(reader.id);
});

// ===============================================================================================
// Room furniture: /api/rooms/:readerId/furniture
// Anyone signed in reads a room; only its owner changes it, sending the whole list of pieces.
// ===============================================================================================
test.describe("room furniture", () => {
  test.describe("authentication", () => {
    test("rejects an unauthenticated GET", async ({ request }) => {
      const response = await request.get(api("/api/rooms/does-not-matter/furniture"));
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated PUT", async ({ request }) => {
      const response = await request.put(api("/api/rooms/does-not-matter/furniture"), { data: { pieces: [] } });
      expect(response.status()).toBe(401);
    });

    test("rejects an invalid token", async ({ request }) => {
      const response = await request.get(api("/api/rooms/does-not-matter/furniture"), {
        headers: { Authorization: "Bearer not-a-real-token" },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe("owner access", () => {
    test("the owner reads their own furniture", async ({ request, reader }) => {
      const response = await request.get(api(`/api/rooms/${reader.id}/furniture`), { headers: auth(reader.session) });
      expect(response.ok()).toBe(true);
      const { pieces } = await response.json();
      expect(pieces).toEqual([]);
    });

    test("the owner saves and reads back their furniture", async ({ request, reader }) => {
      const put = await request.put(api(`/api/rooms/${reader.id}/furniture`), {
        headers: auth(reader.session),
        data: { pieces: [PIECE] },
      });
      expect(put.ok()).toBe(true);
      const saved = await put.json();
      expect(saved.pieces).toHaveLength(1);
      expect(saved.pieces[0].id).toBe(PIECE.id);

      const get = await request.get(api(`/api/rooms/${reader.id}/furniture`), { headers: auth(reader.session) });
      const { pieces } = await get.json();
      expect(pieces).toHaveLength(1);
      expect(pieces[0].id).toBe(PIECE.id);
    });

    test("rejects invalid furniture pieces", async ({ request, reader }) => {
      const response = await request.put(api(`/api/rooms/${reader.id}/furniture`), {
        headers: auth(reader.session),
        data: { pieces: "not a list" },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe("visitor access", () => {
    test("a visitor can read a discoverable reader's furniture", async ({ request, reader }) => {
      const owner = await createReader({ profile: { name: "Furniture Owner", favouriteGenres: ["Fantasy"] } });
      try {
        await setDiscoverable(owner.id, true);
        await request.put(api(`/api/rooms/${owner.id}/furniture`), { headers: auth(owner.session), data: { pieces: [PIECE] } });

        const response = await request.get(api(`/api/rooms/${owner.id}/furniture`), { headers: auth(reader.session) });
        expect(response.ok()).toBe(true);
        const { pieces } = await response.json();
        expect(pieces).toHaveLength(1);
        expect(pieces[0].id).toBe(PIECE.id);
      } finally {
        await cleanSpace(owner.id);
        await owner.remove();
      }
    });

    test("a visitor cannot change another reader's furniture", async ({ request, reader }) => {
      const owner = await createReader({ profile: { name: "Furniture Owner", favouriteGenres: ["Fantasy"] } });
      try {
        await setDiscoverable(owner.id, true);
        await request.put(api(`/api/rooms/${owner.id}/furniture`), { headers: auth(owner.session), data: { pieces: [PIECE] } });

        const response = await request.put(api(`/api/rooms/${owner.id}/furniture`), {
          headers: auth(reader.session),
          data: { pieces: [] },
        });
        expect(response.status()).toBe(403);

        // the owner's furniture is unchanged
        const get = await request.get(api(`/api/rooms/${owner.id}/furniture`), { headers: auth(owner.session) });
        const { pieces } = await get.json();
        expect(pieces).toHaveLength(1);
      } finally {
        await cleanSpace(owner.id);
        await owner.remove();
      }
    });

    test("a visitor cannot read a private non-friend's furniture", async ({ request, reader }) => {
      const owner = await createPrivateReader("Private Owner");
      try {
        const response = await request.get(api(`/api/rooms/${owner.id}/furniture`), { headers: auth(reader.session) });
        expect(response.status()).toBe(404);
      } finally {
        await owner.remove();
      }
    });
  });
});

// ===============================================================================================
// Room notes: /api/rooms/:readerId/notes
// Anyone signed in reads a board; visitors pin notes on other readers' boards only; a note comes
// down when its author or the board's owner takes it down.
// ===============================================================================================
test.describe("room notes", () => {
  test.describe("authentication", () => {
    test("rejects an unauthenticated GET", async ({ request }) => {
      const response = await request.get(api("/api/rooms/does-not-matter/notes"));
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated POST", async ({ request }) => {
      const response = await request.post(api("/api/rooms/does-not-matter/notes"), { data: { text: "Hello" } });
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated DELETE", async ({ request }) => {
      const response = await request.delete(api("/api/rooms/does-not-matter/notes/note-1"));
      expect(response.status()).toBe(401);
    });

    test("rejects an invalid token", async ({ request }) => {
      const response = await request.get(api("/api/rooms/does-not-matter/notes"), {
        headers: { Authorization: "Bearer not-a-real-token" },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe("board access", () => {
    test("the owner reads their own board", async ({ request, reader }) => {
      const response = await request.get(api(`/api/rooms/${reader.id}/notes`), { headers: auth(reader.session) });
      expect(response.ok()).toBe(true);
      const { notes } = await response.json();
      expect(notes).toEqual([]);
    });

    test("a visitor cannot read a private non-friend's board", async ({ request, reader }) => {
      const owner = await createPrivateReader("Private Board");
      try {
        const response = await request.get(api(`/api/rooms/${owner.id}/notes`), { headers: auth(reader.session) });
        expect(response.status()).toBe(404);
      } finally {
        await owner.remove();
      }
    });
  });

  test.describe("posting notes", () => {
    test("a reader cannot post on their own board", async ({ request, reader }) => {
      const response = await request.post(api(`/api/rooms/${reader.id}/notes`), {
        headers: auth(reader.session),
        data: { text: "Note to self", author: "Me" },
      });
      expect(response.status()).toBe(400);
    });

    test("a visitor pins a note on another reader's board", async ({ request, reader }) => {
      const owner = await createReader({ profile: { name: "Board Owner", favouriteGenres: ["Fantasy"] } });
      try {
        await setDiscoverable(owner.id, true);
        const response = await request.post(api(`/api/rooms/${owner.id}/notes`), {
          headers: auth(reader.session),
          data: { text: "Great shelf!", author: "Visitor" },
        });
        expect(response.status()).toBe(201);
        const note = await response.json();
        expect(note.text).toBe("Great shelf!");
        expect(note.authorId).toBe(reader.id);
      } finally {
        await cleanSpace(owner.id);
        await owner.remove();
      }
    });

    test("rejects an empty note", async ({ request, reader }) => {
      const owner = await createReader({ profile: { name: "Board Owner", favouriteGenres: ["Fantasy"] } });
      try {
        await setDiscoverable(owner.id, true);
        const response = await request.post(api(`/api/rooms/${owner.id}/notes`), {
          headers: auth(reader.session),
          data: { text: "   ", author: "Visitor" },
        });
        expect(response.status()).toBe(400);
      } finally {
        await owner.remove();
      }
    });
  });

  test.describe("taking notes down", () => {
    test("the author can take down their own note", async ({ request, reader }) => {
      const owner = await createReader({ profile: { name: "Board Owner", favouriteGenres: ["Fantasy"] } });
      try {
        await setDiscoverable(owner.id, true);
        const post = await request.post(api(`/api/rooms/${owner.id}/notes`), {
          headers: auth(reader.session),
          data: { text: "My note to remove", author: "Visitor" },
        });
        const { id } = await post.json();

        const response = await request.delete(api(`/api/rooms/${owner.id}/notes/${id}`), { headers: auth(reader.session) });
        expect(response.status()).toBe(204);

        const get = await request.get(api(`/api/rooms/${owner.id}/notes`), { headers: auth(reader.session) });
        const { notes } = await get.json();
        expect(notes).toHaveLength(0);
      } finally {
        await cleanSpace(owner.id);
        await owner.remove();
      }
    });

    test("the board owner can take down any note on their board", async ({ request, reader }) => {
      const author = await createReader({ profile: { name: "Note Author", favouriteGenres: ["Fantasy"] } });
      try {
        await setDiscoverable(reader.id, true);
        const post = await request.post(api(`/api/rooms/${reader.id}/notes`), {
          headers: auth(author.session),
          data: { text: "Guest note", author: "Author" },
        });
        const { id } = await post.json();

        const response = await request.delete(api(`/api/rooms/${reader.id}/notes/${id}`), { headers: auth(reader.session) });
        expect(response.status()).toBe(204);
      } finally {
        await cleanSpace(reader.id);
        await author.remove();
      }
    });

    test("an unrelated reader cannot take down someone else's note", async ({ request, reader }) => {
      const owner = await createReader({ profile: { name: "Board Owner", favouriteGenres: ["Fantasy"] } });
      const intruder = await createReader({ profile: { name: "Intruder", favouriteGenres: ["Fantasy"] } });
      try {
        await setDiscoverable(owner.id, true);
        const post = await request.post(api(`/api/rooms/${owner.id}/notes`), {
          headers: auth(reader.session),
          data: { text: "Not yours to remove", author: "Visitor" },
        });
        const { id } = await post.json();

        const response = await request.delete(api(`/api/rooms/${owner.id}/notes/${id}`), { headers: auth(intruder.session) });
        expect(response.status()).toBe(403);

        // the note is still there
        const get = await request.get(api(`/api/rooms/${owner.id}/notes`), { headers: auth(reader.session) });
        const { notes } = await get.json();
        expect(notes).toHaveLength(1);
      } finally {
        await cleanSpace(owner.id);
        await owner.remove();
        await intruder.remove();
      }
    });
  });
});

// ===============================================================================================
// User books / shelf: /api/user-books
// Only the authenticated reader's shelf — all operations are scoped to req.user.id. There is no
// :userId parameter; the endpoint never returns or modifies another reader's books.
// ===============================================================================================
test.describe("user books / shelf", () => {
  test.describe("authentication", () => {
    test("rejects an unauthenticated GET", async ({ request }) => {
      const response = await request.get(api("/api/user-books"));
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated POST", async ({ request }) => {
      const response = await request.post(api("/api/user-books"), { data: { bookId: "any", status: "want_to_read" } });
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated DELETE", async ({ request }) => {
      const response = await request.delete(api("/api/user-books/any"));
      expect(response.status()).toBe(401);
    });
  });

  test.describe("owner access", () => {
    test("the reader adds, lists, updates and removes a book on their shelf", async ({ request, reader }) => {
      const bookId = uniqueBookId();

      // add
      const post = await request.post(api("/api/user-books"), {
        headers: auth(reader.session),
        data: { bookId, status: "want_to_read" },
      });
      expect(post.status()).toBe(201);

      // list — it is there
      const get = await request.get(api("/api/user-books"), { headers: auth(reader.session) });
      expect(get.ok()).toBe(true);
      const { books } = await get.json();
      expect(books.some((b) => b.id === bookId)).toBe(true);

      // update status and progress
      const patch = await request.patch(api(`/api/user-books/${bookId}`), {
        headers: auth(reader.session),
        data: { status: "reading", progress: 30 },
      });
      expect(patch.ok()).toBe(true);

      // remove
      const del = await request.delete(api(`/api/user-books/${bookId}`), { headers: auth(reader.session) });
      expect(del.status()).toBe(204);

      // it is gone
      const after = await request.get(api("/api/user-books"), { headers: auth(reader.session) });
      const { books: afterBooks } = await after.json();
      expect(afterBooks.some((b) => b.id === bookId)).toBe(false);
    });

    test("rejects an invalid reading status", async ({ request, reader }) => {
      const response = await request.post(api("/api/user-books"), {
        headers: auth(reader.session),
        data: { bookId: uniqueBookId(), status: "not_a_status" },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe("isolation between readers", () => {
    test("one reader's books do not appear on another reader's shelf", async ({ request, reader }) => {
      const other = await createReader({ profile: { name: "Other Reader", favouriteGenres: ["Fantasy"] } });
      const bookId = uniqueBookId();
      try {
        await request.post(api("/api/user-books"), {
          headers: auth(reader.session),
          data: { bookId, status: "want_to_read" },
        });

        // the other reader's shelf does not include it
        const otherShelf = await request.get(api("/api/user-books"), { headers: auth(other.session) });
        const { books: otherBooks } = await otherShelf.json();
        expect(otherBooks.some((b) => b.id === bookId)).toBe(false);

        // the reader's shelf does include it
        const myShelf = await request.get(api("/api/user-books"), { headers: auth(reader.session) });
        const { books: mine } = await myShelf.json();
        expect(mine.some((b) => b.id === bookId)).toBe(true);
      } finally {
        await cleanSpace(other.id);
        await other.remove();
      }
    });
  });
});

// ===============================================================================================
// Book reviews: /api/books/:id/reviews
// Any signed-in reader can read a book's reviews. A reader writes, edits and deletes only their
// own review; the delete is scoped to the authenticated user (WHERE user_id = viewerId), so one
// reader can never remove another's review.
// ===============================================================================================
test.describe("book reviews", () => {
  test.describe("authentication", () => {
    test("rejects an unauthenticated GET", async ({ request }) => {
      const response = await request.get(api("/api/books/any-book/reviews"));
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated POST", async ({ request }) => {
      const response = await request.post(api("/api/books/any-book/reviews"), { data: { rating: 5 } });
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated DELETE", async ({ request }) => {
      const response = await request.delete(api("/api/books/any-book/reviews"));
      expect(response.status()).toBe(401);
    });
  });

  test.describe("reading and writing reviews", () => {
    test("a signed-in reader can list a book's reviews", async ({ request, reader }) => {
      const response = await request.get(api(`/api/books/${uniqueBookId()}/reviews`), { headers: auth(reader.session) });
      expect(response.ok()).toBe(true);
      const { reviews } = await response.json();
      expect(Array.isArray(reviews)).toBe(true);
    });

    test("a reader can post and delete their own review", async ({ request, reader }) => {
      const bookId = uniqueBookId();
      const post = await request.post(api(`/api/books/${bookId}/reviews`), {
        headers: auth(reader.session),
        data: { rating: 4, reviewText: "Good read." },
      });
      expect(post.status()).toBe(201);
      const { review } = await post.json();
      expect(review.rating).toBe(4);
      expect(review.mine).toBe(true);

      const del = await request.delete(api(`/api/books/${bookId}/reviews`), { headers: auth(reader.session) });
      expect(del.status()).toBe(204);

      const get = await request.get(api(`/api/books/${bookId}/reviews`), { headers: auth(reader.session) });
      const { reviews } = await get.json();
      expect(reviews.some((r) => r.id === review.id)).toBe(false);
    });

    test("rejects a rating outside 1-5", async ({ request, reader }) => {
      const response = await request.post(api(`/api/books/${uniqueBookId()}/reviews`), {
        headers: auth(reader.session),
        data: { rating: 6 },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe("cross-reader isolation", () => {
    test("a reader cannot delete another reader's review", async ({ request, reader }) => {
      const other = await createReader({ profile: { name: "Reviewer B", favouriteGenres: ["Fantasy"] } });
      const bookId = uniqueBookId();
      try {
        // other reader posts a review
        const post = await request.post(api(`/api/books/${bookId}/reviews`), {
          headers: auth(other.session),
          data: { rating: 5, reviewText: "Loved it." },
        });
        const { review } = await post.json();

        // reader tries to delete — returns 204 but only deletes their own review (none for this book)
        await request.delete(api(`/api/books/${bookId}/reviews`), { headers: auth(reader.session) });

        // the other reader's review is still there
        const get = await request.get(api(`/api/books/${bookId}/reviews`), { headers: auth(reader.session) });
        const { reviews } = await get.json();
        expect(reviews.some((r) => r.id === review.id)).toBe(true);
        expect(reviews.find((r) => r.id === review.id).mine).toBe(false);
      } finally {
        await cleanSpace(other.id);
        await other.remove();
      }
    });
  });
});

// ===============================================================================================
// Saved mood quotes: /api/saved-quotes
// A reader can list, save and remove only their own quotes. The delete is scoped to the
// authenticated user (WHERE user_id = viewerId), so one reader cannot remove another's quote.
// ===============================================================================================
test.describe("saved mood quotes", () => {
  test.describe("authentication", () => {
    test("rejects an unauthenticated GET", async ({ request }) => {
      const response = await request.get(api("/api/saved-quotes"));
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated POST", async ({ request }) => {
      const response = await request.post(api("/api/saved-quotes"), { data: { quoteText: "A quote" } });
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated DELETE", async ({ request }) => {
      const response = await request.delete(api("/api/saved-quotes/does-not-matter"));
      expect(response.status()).toBe(401);
    });
  });

  test.describe("owner access", () => {
    test("a reader can save, list and remove their own quote", async ({ request, reader }) => {
      const post = await request.post(api("/api/saved-quotes"), {
        headers: auth(reader.session),
        data: { quoteText: "So many books, so little time.", author: "Unknown", work: "Books" },
      });
      expect(post.status()).toBe(201);
      const quote = await post.json();
      expect(quote.quoteText).toBe("So many books, so little time.");

      const get = await request.get(api("/api/saved-quotes"), { headers: auth(reader.session) });
      expect(get.ok()).toBe(true);
      const { quotes } = await get.json();
      expect(quotes.some((q) => q.id === quote.id)).toBe(true);

      const del = await request.delete(api(`/api/saved-quotes/${quote.id}`), { headers: auth(reader.session) });
      expect(del.status()).toBe(204);

      const after = await request.get(api("/api/saved-quotes"), { headers: auth(reader.session) });
      const { quotes: afterQuotes } = await after.json();
      expect(afterQuotes.some((q) => q.id === quote.id)).toBe(false);
    });

    test("rejects an empty quote", async ({ request, reader }) => {
      const response = await request.post(api("/api/saved-quotes"), {
        headers: auth(reader.session),
        data: { quoteText: "" },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe("cross-reader isolation", () => {
    test("a reader cannot remove another reader's quote", async ({ request, reader }) => {
      const other = await createReader({ profile: { name: "Quote Saver", favouriteGenres: ["Fantasy"] } });
      try {
        const post = await request.post(api("/api/saved-quotes"), {
          headers: auth(other.session),
          data: { quoteText: "My private quote.", author: "Other", work: "Diary" },
        });
        const { id } = await post.json();

        // reader tries to delete the other reader's quote
        const del = await request.delete(api(`/api/saved-quotes/${id}`), { headers: auth(reader.session) });
        expect(del.status()).toBe(404);

        // the quote is still on the other reader's list
        const otherGet = await request.get(api("/api/saved-quotes"), { headers: auth(other.session) });
        const { quotes } = await otherGet.json();
        expect(quotes.some((q) => q.id === id)).toBe(true);
      } finally {
        await cleanSpace(other.id);
        await other.remove();
      }
    });
  });
});

// ===============================================================================================
// Reader profiles: /api/people
// Any signed-in reader can list discoverable readers and view a discoverable reader's profile.
// A private reader is hidden unless they are a friend of the viewer.
// ===============================================================================================
test.describe("reader profiles", () => {
  test.describe("authentication", () => {
    test("rejects an unauthenticated list", async ({ request }) => {
      const response = await request.get(api("/api/people"));
      expect(response.status()).toBe(401);
    });

    test("rejects an unauthenticated profile lookup", async ({ request }) => {
      const response = await request.get(api("/api/people/does-not-matter"));
      expect(response.status()).toBe(401);
    });
  });

  test.describe("listing and lookup", () => {
    test("the reader is not in their own list", async ({ request, reader }) => {
      const response = await request.get(api("/api/people"), { headers: auth(reader.session) });
      expect(response.ok()).toBe(true);
      const { readers } = await response.json();
      expect(readers.some((r) => r.userId === reader.id)).toBe(false);
    });

    test("a discoverable reader can be found by their username", async ({ request, reader }) => {
      const other = await createPrivateReader("Visible Reader");
      try {
        await setDiscoverable(other.id, true);
        const response = await request.get(api(`/api/people/${other.username}`), { headers: auth(reader.session) });
        expect(response.ok()).toBe(true);
        const { reader: found } = await response.json();
        expect(found.username).toBe(other.username);
      } finally {
        await other.remove();
      }
    });

    test("a private non-friend reader cannot be found", async ({ request, reader }) => {
      const other = await createPrivateReader("Hidden Reader");
      try {
        const response = await request.get(api(`/api/people/${other.username}`), { headers: auth(reader.session) });
        expect(response.status()).toBe(404);
      } finally {
        await other.remove();
      }
    });

    test("a private friend can be found", async ({ request, reader }) => {
      const other = await createPrivateReader("Friend Reader");
      try {
        await makeFriends(reader.id, other.id);
        const response = await request.get(api(`/api/people/${other.username}`), { headers: auth(reader.session) });
        expect(response.ok()).toBe(true);
        const { reader: found } = await response.json();
        expect(found.username).toBe(other.username);
      } finally {
        await other.remove();
      }
    });
  });
});
