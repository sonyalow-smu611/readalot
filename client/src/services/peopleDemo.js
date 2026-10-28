/**
 * Local-only Discover People demonstration data.
 * Fictional readers and approximate sample map coordinates.
 * Replace this service with the existing API when real user profiles are ready.
 */
const FOLLOW_KEY = 'readalot_demo_following_v1';

export const myDemoProfile = {
  id: 'readalot-demo-me',
  displayName: 'You (Demo Reader)',
  favoriteGenres: ['Mystery', 'Fantasy', 'Literary Fiction'],
  books: [
    { id: 'book-hobbit', title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy', status: 'Finished' },
    { id: 'book-secret-history', title: 'The Secret History', author: 'Donna Tartt', genre: 'Mystery', status: 'Reading' },
    { id: 'book-pride', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Literary Fiction', status: 'To Read' },
    { id: 'book-dune', title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', status: 'To Read' },
  ],
};

export const sampleReaders = [
  {
    id: 'reader-emma', username: 'emma.reads', displayName: 'Emma Tan', initials: 'ET',
    tagline: 'One more chapter, always.', neighborhood: 'Bishan (demo)', lat: 1.351, lng: 103.849,
    favoriteGenres: ['Fantasy', 'Mystery', 'Romance'],
    books: [
      { id: 'book-hobbit', title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy', status: 'Finished' },
      { id: 'book-secret-history', title: 'The Secret History', author: 'Donna Tartt', genre: 'Mystery', status: 'Reading' },
      { id: 'book-fourth-wing', title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', status: 'To Read' },
    ],
  },
  {
    id: 'reader-ayaan', username: 'ayaan.pages', displayName: 'Ayaan Rahman', initials: 'AR',
    tagline: 'Sci-fi and late-night book discussions.', neighborhood: 'Jurong East (demo)', lat: 1.333, lng: 103.742,
    favoriteGenres: ['Science Fiction', 'Fantasy', 'History'],
    books: [
      { id: 'book-dune', title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', status: 'Reading' },
      { id: 'book-hobbit', title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy', status: 'Finished' },
      { id: 'book-project-hail', title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Science Fiction', status: 'To Read' },
    ],
  },
  {
    id: 'reader-sofia', username: 'sofia.shelves', displayName: 'Sofia Lim', initials: 'SL',
    tagline: 'Annotated classics, tea and poetry.', neighborhood: 'Tampines (demo)', lat: 1.354, lng: 103.945,
    favoriteGenres: ['Literary Fiction', 'Poetry', 'Mystery'],
    books: [
      { id: 'book-pride', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Literary Fiction', status: 'Reading' },
      { id: 'book-secret-history', title: 'The Secret History', author: 'Donna Tartt', genre: 'Mystery', status: 'Finished' },
      { id: 'book-little-women', title: 'Little Women', author: 'Louisa May Alcott', genre: 'Literary Fiction', status: 'To Read' },
    ],
  },
  {
    id: 'reader-noah', username: 'noah.bookmarks', displayName: 'Noah Koh', initials: 'NK',
    tagline: 'Collecting recommendations faster than I read.', neighborhood: 'Woodlands (demo)', lat: 1.438, lng: 103.786,
    favoriteGenres: ['Thriller', 'History', 'Science Fiction'],
    books: [
      { id: 'book-dune', title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', status: 'Finished' },
      { id: 'book-sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', status: 'Reading' },
      { id: 'book-gone-girl', title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', status: 'To Read' },
    ],
  },
  {
    id: 'reader-mei', username: 'mei.margins', displayName: 'Mei Chen', initials: 'MC',
    tagline: 'Cosy mysteries and rainy-day rereads.', neighborhood: 'Clementi (demo)', lat: 1.315, lng: 103.765,
    favoriteGenres: ['Mystery', 'Romance', 'Literary Fiction'],
    books: [
      { id: 'book-secret-history', title: 'The Secret History', author: 'Donna Tartt', genre: 'Mystery', status: 'Reading' },
      { id: 'book-pride', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Literary Fiction', status: 'Finished' },
      { id: 'book-little-women', title: 'Little Women', author: 'Louisa May Alcott', genre: 'Literary Fiction', status: 'To Read' },
    ],
  },
  {
    id: 'reader-priya', username: 'priya.pagecount', displayName: 'Priya Nair', initials: 'PN',
    tagline: 'Big fantasy series, one door-stopper at a time.', neighborhood: 'Serangoon (demo)', lat: 1.350, lng: 103.873,
    favoriteGenres: ['Fantasy', 'Science Fiction', 'Romance'],
    books: [
      { id: 'book-fourth-wing', title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', status: 'Reading' },
      { id: 'book-hobbit', title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy', status: 'Finished' },
      { id: 'book-project-hail', title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Science Fiction', status: 'To Read' },
    ],
  },
  {
    id: 'reader-daniel', username: 'daniel.dogears', displayName: 'Daniel Ong', initials: 'DO',
    tagline: 'Started a book club, then got busy.', neighborhood: 'Pasir Ris (demo)', lat: 1.373, lng: 103.949,
    favoriteGenres: ['History', 'Thriller', 'Literary Fiction'],
    books: [
      { id: 'book-sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', status: 'Reading' },
      { id: 'book-gone-girl', title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', status: 'Finished' },
      { id: 'book-pride', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Literary Fiction', status: 'To Read' },
    ],
  },
];

export function getDemoReader(id) {
  return sampleReaders.find((reader) => reader.id === String(id)) ?? null;
}

export function getSharedBooks(reader) {
  const myIds = new Set(myDemoProfile.books.map((book) => book.id));
  return reader.books.filter((book) => myIds.has(book.id));
}

export function getSharedGenres(reader) {
  const mine = new Set(myDemoProfile.favoriteGenres);
  return reader.favoriteGenres.filter((genre) => mine.has(genre));
}

/** A transparent illustrative match metric, not a validated recommendation algorithm.
 * 60% = fraction of my books also on their shelf; 40% = fraction of my favorite genres shared.
 */
export function getCompatibility(reader) {
  const sharedBooks = getSharedBooks(reader).length;
  const sharedGenres = getSharedGenres(reader).length;
  const bookRatio = sharedBooks / Math.max(1, myDemoProfile.books.length);
  const genreRatio = sharedGenres / Math.max(1, myDemoProfile.favoriteGenres.length);
  return Math.round(100 * (0.6 * bookRatio + 0.4 * genreRatio));
}

export function getCurrentlyReading(reader) {
  return reader.books.find((book) => book.status === 'Reading') ?? null;
}

function loadFollowing() {
  try {
    const stored = JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isFollowing(readerId) {
  return loadFollowing().includes(String(readerId));
}

export function toggleFollow(readerId) {
  const id = String(readerId);
  if (!getDemoReader(id)) throw new Error('Unknown demo reader');
  const following = new Set(loadFollowing());
  if (following.has(id)) following.delete(id);
  else following.add(id);
  try {
    localStorage.setItem(FOLLOW_KEY, JSON.stringify([...following]));
  } catch {
    throw new Error('Browser storage is unavailable. Following could not be saved.');
  }
  return following.has(id);
}
