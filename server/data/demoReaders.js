// The seven demo readers who live in town (the Cafe, the friends' houses). scripts/seedReaders.js
// puts them in Supabase as real accounts; without Supabase (the e2e tests) the people route
// serves them from here. Fictional people, approximate sample locations.
// awayMinutes: how long ago they were last online when seeded (online within 5 minutes; a house
// gathers dust after a month away). character: their town look (see client/src/lib/avatar/catalogue.js).

const MINUTE = 1;
const DAY = 24 * 60 * MINUTE;

export const DEMO_BOOKS = [
  { id: "book-hobbit", title: "The Hobbit", author: "J. R. R. Tolkien", genre: "Fantasy" },
  { id: "book-secret-history", title: "The Secret History", author: "Donna Tartt", genre: "Mystery" },
  { id: "book-fourth-wing", title: "Fourth Wing", author: "Rebecca Yarros", genre: "Fantasy" },
  { id: "book-dune", title: "Dune", author: "Frank Herbert", genre: "Science Fiction" },
  { id: "book-project-hail", title: "Project Hail Mary", author: "Andy Weir", genre: "Science Fiction" },
  { id: "book-pride", title: "Pride and Prejudice", author: "Jane Austen", genre: "Literary Fiction" },
  { id: "book-little-women", title: "Little Women", author: "Louisa May Alcott", genre: "Literary Fiction" },
  { id: "book-sapiens", title: "Sapiens", author: "Yuval Noah Harari", genre: "History" },
  { id: "book-gone-girl", title: "Gone Girl", author: "Gillian Flynn", genre: "Thriller" }
];

// shelf statuses as user_books stores them
const READ = "read";
const READING = "reading";
const WANT = "want_to_read";

export const DEMO_READERS = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    username: "emma.reads",
    displayName: "Emma Tan",
    tagline: "One more chapter, always.",
    neighborhood: "Bishan (demo)",
    lat: 1.351,
    lng: 103.849,
    favoriteGenres: ["Fantasy", "Mystery", "Romance"],
    awayMinutes: MINUTE,
    character: { base: "maya", hair: "bun", hairColour: "chestnut", skin: "tone-4", top: "puffer", topColour: "red", bottom: "baggy", bottomColour: "slate", shoes: "trainers", shoeColour: "ink" },
    shelf: [["book-hobbit", READ], ["book-secret-history", READING], ["book-fourth-wing", WANT]]
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    username: "ayaan.pages",
    displayName: "Ayaan Rahman",
    tagline: "Sci-fi and late-night book discussions.",
    neighborhood: "Jurong East (demo)",
    lat: 1.333,
    lng: 103.742,
    favoriteGenres: ["Science Fiction", "Fantasy", "History"],
    awayMinutes: MINUTE,
    character: { base: "jay", hair: "twists", hairColour: "blonde", skin: "tone-9", top: "fuzzy", topColour: "mustard", bottom: "ripped", bottomColour: "denim", shoes: "skaters", shoeColour: "ink", eyes: "goggles" },
    shelf: [["book-dune", READING], ["book-hobbit", READ], ["book-project-hail", WANT]]
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    username: "sofia.shelves",
    displayName: "Sofia Lim",
    tagline: "Annotated classics, tea and poetry.",
    neighborhood: "Tampines (demo)",
    lat: 1.354,
    lng: 103.945,
    favoriteGenres: ["Literary Fiction", "Poetry", "Mystery"],
    awayMinutes: 12 * DAY,
    character: { base: "rosie", hair: "long", hairColour: "pink", skin: "tone-2", top: "pinafore", topColour: "pink", bottom: "skirt", bottomColour: "cream", shoes: "trainers", shoeColour: "pink" },
    shelf: [["book-pride", READING], ["book-secret-history", READ], ["book-little-women", WANT]]
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    username: "noah.bookmarks",
    displayName: "Noah Koh",
    tagline: "Collecting recommendations faster than I read.",
    neighborhood: "Woodlands (demo)",
    lat: 1.438,
    lng: 103.786,
    favoriteGenres: ["Thriller", "History", "Science Fiction"],
    awayMinutes: 70 * DAY,
    character: { base: "nova", hair: "puff", hairColour: "ginger", skin: "tone-8", top: "puffer", topColour: "charcoal", bottom: "baggy", bottomColour: "charcoal", shoes: "trainers", shoeColour: "ink", neck: "scarf-grey" },
    shelf: [["book-dune", READ], ["book-sapiens", READING], ["book-gone-girl", WANT]]
  },
  {
    id: "00000000-0000-4000-8000-000000000205",
    username: "mei.margins",
    displayName: "Mei Chen",
    tagline: "Cosy mysteries and rainy-day rereads.",
    neighborhood: "Clementi (demo)",
    lat: 1.315,
    lng: 103.765,
    favoriteGenres: ["Mystery", "Romance", "Literary Fiction"],
    awayMinutes: 35 * DAY,
    character: { base: "nova", hair: "twists", hairColour: "ash", skin: "tone-4", top: "puffer", topColour: "sky", bottom: "skirt", bottomColour: "olive", shoes: "trainers", shoeColour: "ink" },
    shelf: [["book-secret-history", READING], ["book-pride", READ], ["book-little-women", WANT]]
  },
  {
    id: "00000000-0000-4000-8000-000000000206",
    username: "priya.pagecount",
    displayName: "Priya Nair",
    tagline: "Big fantasy series, one door-stopper at a time.",
    neighborhood: "Serangoon (demo)",
    lat: 1.35,
    lng: 103.873,
    favoriteGenres: ["Fantasy", "Science Fiction", "Romance"],
    awayMinutes: 2 * DAY,
    character: { base: "rex", hair: "curly", hairColour: "sandy", skin: "tone-8", top: "fuzzy", topColour: "lilac", bottom: "baggy", bottomColour: "olive", shoes: "trainers", shoeColour: "grey", hairAccessory: "flower-pink", neck: "scarf-grey" },
    shelf: [["book-fourth-wing", READING], ["book-hobbit", READ], ["book-project-hail", WANT]]
  },
  {
    id: "00000000-0000-4000-8000-000000000207",
    username: "daniel.dogears",
    displayName: "Daniel Ong",
    tagline: "Started a book club, then got busy.",
    neighborhood: "Pasir Ris (demo)",
    lat: 1.373,
    lng: 103.949,
    favoriteGenres: ["History", "Thriller", "Literary Fiction"],
    awayMinutes: 100 * DAY,
    character: { base: "jay", hair: "curly", hairColour: "auburn", skin: "tone-9", top: "pinafore", topColour: "mustard", bottom: "skirt", bottomColour: "grey", shoes: "skaters", shoeColour: "grey", neck: "scarf-grey" },
    shelf: [["book-sapiens", READING], ["book-gone-girl", READ], ["book-pride", WANT]]
  }
];
