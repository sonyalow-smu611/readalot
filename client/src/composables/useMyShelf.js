import { computed, ref } from "vue";
import { getMyBooks, updateReadingStatus } from "../services/api.js";
import { useAsync } from "./useAsync.js";

// Where each book sits on the shelf is a per-device preference, not server data.
const ORDER_KEY = "readalot.shelfOrder";

function readOrder() {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
  } catch {
    return [];
  }
}

export function useMyShelf() {
  const books = ref([]);
  const order = ref(readOrder());
  const moveError = ref("");
  const { error, loading, run } = useAsync(async () => {
    books.value = (await getMyBooks()).books;
  });

  const sorted = computed(() => {
    const rank = new Map(order.value.map((id, index) => [id, index]));
    const last = order.value.length;
    return [...books.value].sort((a, b) => (rank.get(a.id) ?? last) - (rank.get(b.id) ?? last));
  });

  const currentBook = computed(
    () =>
      books.value
        .filter((book) => book.status === "reading")
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0] || null
  );

  function load() {
    return run().catch(() => {});
  }

  // Put a book on a status shelf, in front of `beforeId` (or at the end when null).
  async function move(id, status, beforeId = null) {
    const book = books.value.find((item) => item.id === id);
    if (!book) return;

    const ids = sorted.value.map((item) => item.id).filter((item) => item !== id);
    const at = beforeId ? ids.indexOf(beforeId) : -1;
    ids.splice(at < 0 ? ids.length : at, 0, id);
    order.value = ids;
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
    } catch {
      // storage unavailable: the order just lasts for this visit
    }

    if (book.status === status) return;

    const previous = { status: book.status, updatedAt: book.updatedAt };
    book.status = status;
    book.updatedAt = new Date().toISOString();
    moveError.value = "";

    try {
      await updateReadingStatus(id, { status });
    } catch {
      Object.assign(book, previous);
      moveError.value = `Couldn't move "${book.title}". Try again.`;
    }
  }

  return { books: sorted, currentBook, loading, error, moveError, load, move };
}
