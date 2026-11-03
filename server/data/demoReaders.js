// The demo readers who live in town (the Cafe, the friends' houses). scripts/seedReaders.js
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

// Pip, the neighbour every reader can befriend (the last reader below)
export const NEIGHBOUR_ID = "00000000-0000-4000-8000-000000000208";
export const NEIGHBOUR_USERNAME = "pip.ikda";

// shelf statuses as user_books stores them
const READ = "read";
const READING = "reading";
const WANT = "want_to_read";

// A sample reader's room furniture, as a reader's own placed pieces: { uid, id, zone, x }, with x
// along its zone (client/src/buildings/house/strip/layout.js). The seed saves it in room_furniture.
const furnished = (username, pieces) => pieces.map((piece, k) => ({ uid: `demo-${username}-${k}`, ...piece }));

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
    shelf: [["book-hobbit", READ], ["book-secret-history", READING], ["book-fourth-wing", WANT]],
    furniture: furnished("emma.reads", [
      { id: "chair-wingback", zone: "chair", x: 0.28 },
      { id: "poster-moon", zone: "wall", x: 0.36 },
      { id: "frame-botanical", zone: "wall", x: 0.91 },
      { id: "plant-monstera", zone: "room", x: 0.15 },
      { id: "cat-ginger", zone: "room", x: 0.5 }
    ])
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
    shelf: [["book-dune", READING], ["book-hobbit", READ], ["book-project-hail", WANT]],
    furniture: furnished("ayaan.pages", [
      { id: "chair-papasan", zone: "chair", x: 0.28 },
      { id: "poster-mountain", zone: "wall", x: 0.22 },
      { id: "frame-gold", zone: "wall", x: 0.69 },
      { id: "plant-fig", zone: "room", x: 0.69 },
      { id: "cat-black", zone: "room", x: 0.5 }
    ])
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
    shelf: [["book-pride", READING], ["book-secret-history", READ], ["book-little-women", WANT]],
    furniture: furnished("sofia.shelves", [
      { id: "chair-rocking", zone: "chair", x: 0.28 },
      { id: "frame-botanical", zone: "wall", x: 0.36 },
      { id: "frame-gold", zone: "wall", x: 0.91 },
      { id: "plant-succulents", zone: "seat", x: 0.5 },
      { id: "cat-calico", zone: "room", x: 0.5 }
    ])
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
    shelf: [["book-dune", READ], ["book-sapiens", READING], ["book-gone-girl", WANT]],
    furniture: furnished("noah.bookmarks", [
      { id: "chair-wingback", zone: "chair", x: 0.28 },
      { id: "poster-book-club", zone: "wall", x: 0.36 },
      { id: "poster-mountain", zone: "wall", x: 0.69 },
      { id: "plant-monstera", zone: "room", x: 0.51 },
      { id: "cat-black", zone: "room", x: 0.5 }
    ])
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
  },
  // Pip, everyone's neighbour (like Hay Day's Greg): always online, accepts a friend request straight
  // away, pins a welcome note on your board when you become friends (services/friends.js) and
  // answers your messages (database/neighbour.sql). The walkthrough introduces them.
  {
    id: NEIGHBOUR_ID,
    username: NEIGHBOUR_USERNAME,
    displayName: "Pip the Librarian",
    tagline: "Town librarian. Ask me for a book!",
    neighborhood: "IKDA Town",
    lat: 1.3,
    lng: 103.85,
    favoriteGenres: ["Fantasy", "Mystery", "Science Fiction", "Romance"],
    awayMinutes: 0,
    character: { base: "rex", hair: "bun", hairColour: "auburn", skin: "tone-3", top: "fuzzy", topColour: "sage", bottom: "baggy", bottomColour: "slate", shoes: "trainers", shoeColour: "ink", neck: "scarf-grey" },
    shelf: [["book-hobbit", READ], ["book-project-hail", READING], ["book-pride", READ], ["book-secret-history", WANT]],
    furniture: furnished(NEIGHBOUR_USERNAME, [
      { id: "chair-wingback", zone: "chair", x: 0.28 },
      { id: "frame-botanical", zone: "wall", x: 0.36 },
      { id: "plant-monstera", zone: "room", x: 0.15 },
      { id: "cat-ginger", zone: "room", x: 0.5 }
    ])
  }
];
