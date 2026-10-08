// In-memory shelf served when Supabase is not configured, so the app is demoable without keys.
// Resets whenever the server restarts.
function book(n, title, author, genre, pageCount, averageRating, status, progress, description) {
  return {
    id: `demo-shelf-${n}`,
    googleBooksId: `demo-shelf-${n}`,
    title,
    authors: [author],
    coverUrl: "",
    description,
    genres: [genre],
    publisher: "",
    publishedDate: "",
    isbn: "",
    averageRating,
    pageCount,
    status,
    progress,
    updatedAt: new Date(Date.UTC(2026, 0, 1) + n * 86400000).toISOString()
  };
}

export const demoShelf = [
  book(1, "Norwegian Wood", "Haruki Murakami", "Fiction", 296, 4.0, "reading", 42, "A student in 1960s Tokyo is pulled between two very different women while grieving a friend."),
  book(2, "The Hobbit", "J.R.R. Tolkien", "Fantasy", 310, 4.3, "want_to_read", 0, "A comfort-loving hobbit is swept into a quest to win back a dragon's hoard."),
  book(3, "Circe", "Madeline Miller", "Fantasy", 393, 4.2, "want_to_read", 0, "The exiled witch of the Odyssey tells her own story of gods, monsters and mortals."),
  book(4, "The Name of the Wind", "Patrick Rothfuss", "Fantasy", 662, 4.5, "want_to_read", 0, "An innkeeper with a hidden past recounts how he became a legend."),
  book(5, "Piranesi", "Susanna Clarke", "Fantasy", 245, 4.2, "want_to_read", 0, "A man lives alone in an endless house of statues and tides, and starts to doubt what he knows."),
  book(6, "A Wizard of Earthsea", "Ursula K. Le Guin", "Fantasy", 183, 4.0, "want_to_read", 0, "A gifted, proud young wizard unleashes a shadow he must hunt across the sea."),
  book(7, "Pride and Prejudice", "Jane Austen", "Classics", 279, 4.3, "read", 100, "Elizabeth Bennet spars with the proud Mr Darcy in a comedy of manners and misjudgement."),
  book(8, "Jane Eyre", "Charlotte Brontë", "Classics", 532, 4.1, "read", 100, "An orphaned governess falls for her employer and discovers the secret in his house."),
  book(9, "The Great Gatsby", "F. Scott Fitzgerald", "Classics", 180, 3.9, "read", 100, "A mysterious millionaire throws lavish parties in pursuit of a lost love."),
  book(10, "Frankenstein", "Mary Shelley", "Classics", 280, 3.9, "read", 100, "A young scientist creates life and is haunted by what he abandons."),
  book(11, "Little Women", "Louisa May Alcott", "Classics", 449, 4.1, "read", 100, "Four sisters grow up, quarrel and find their own paths in Civil War New England."),
  book(12, "Persuasion", "Jane Austen", "Romance", 249, 4.1, "read", 100, "Eight years after being persuaded to refuse him, Anne Elliot meets Captain Wentworth again."),
  book(13, "Normal People", "Sally Rooney", "Romance", 266, 3.8, "read", 100, "Two classmates from a small Irish town drift in and out of each other's lives."),
  book(14, "The Night Circus", "Erin Morgenstern", "Romance", 387, 4.0, "read", 100, "Two young magicians are bound into a duel staged inside a circus that only opens at night."),
  book(15, "Dune", "Frank Herbert", "Science Fiction", 612, 4.3, "want_to_read", 0, "A noble heir is cast into the desert of the only planet that produces the spice."),
  book(16, "Gone Girl", "Gillian Flynn", "Mystery", 415, 4.1, "read", 100, "A wife vanishes on her anniversary and her husband becomes the prime suspect.")
];

export function findDemoBook(id) {
  return demoShelf.find((item) => item.id === id);
}
