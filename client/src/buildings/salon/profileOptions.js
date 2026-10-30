// Scaffolded with AI assistance — see AI_USAGE.md
// The fixed lists the salon's profile cards and edit form share.

export const GENRES = [
  'Fantasy',
  'Literary Fiction',
  'Magical Realism',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Classic',
  'Historical Fiction',
  'Memoir',
  'Non-fiction',
  'Self-Help',
]

export const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say']
export const FAITHS = ['Christianity', 'Islam', 'Buddhism', 'Hinduism', 'Sikhism', 'Judaism', 'None', 'Prefer not to say']

// Emoji avatars, saved with the profile until avatar uploads exist.
export const AVATARS = [
  { emoji: '🐨', name: 'Koala' },
  { emoji: '🦊', name: 'Fox' },
  { emoji: '🐱', name: 'Cat' },
  { emoji: '🦉', name: 'Owl' },
  { emoji: '🐻', name: 'Bear' },
  { emoji: '🐼', name: 'Panda' },
]

export const SHELF_STATS = [
  { status: 'reading', label: 'Reading', empty: 'Nothing on the go. Start a book from your To read list.' },
  { status: 'want_to_read', label: 'To read', empty: 'Your To read list is empty. Add books from Discover.' },
  { status: 'read', label: 'Finished', empty: 'No finished books yet.' },
]

// The "About you" cards, each edited on its own.
export const ABOUT_FIELDS = [
  { key: 'gender', label: 'Gender', kind: 'choice', options: GENDERS },
  { key: 'age', label: 'Age', kind: 'number' },
  { key: 'religion', label: 'Religion', kind: 'choice', options: FAITHS },
  { key: 'location', label: 'Location', kind: 'text' },
]

// What the pop-up says after the public or private switch is flipped.
export const PRIVACY_ALERTS = {
  public: { title: 'You can now be discovered by people!', note: 'Readers near you can see you in their town.' },
  private: { title: 'You are now in private mode!', note: 'You are hidden, and your last location is deleted.' },
}

export function validAge(value) {
  const years = Number(value)
  return Number.isInteger(years) && years >= 13 && years <= 120
}
