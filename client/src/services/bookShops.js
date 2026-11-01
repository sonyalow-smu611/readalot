// Scaffolded with AI assistance — see AI_USAGE.md
// Where a reader can get a book: links that open each shop's own search for it, so nothing is
// fetched here and no shop needs a key. Shops that search well by ISBN get the ISBN when the
// book has one; the rest (and every shop, for a book with no ISBN) get its title and author.
// Google Books links straight to the book when the server sent its buy or info page.

const SHOPS = [
  {
    group: 'Bookshops in Singapore',
    shops: [
      { name: 'Kinokuniya', byIsbn: true, url: (q) => `https://singapore.kinokuniya.com/products?utf8=%E2%9C%93&is_searching=true&keywords=${q}` },
      { name: 'Popular', url: (q) => `https://www.popular.com.sg/search?q=${q}` },
      { name: 'Amazon Singapore', byIsbn: true, url: (q) => `https://www.amazon.sg/s?k=${q}&i=stripbooks` },
    ],
  },
  {
    group: 'Online bookshops',
    shops: [
      { name: 'Amazon', byIsbn: true, url: (q) => `https://www.amazon.com/s?k=${q}&i=stripbooks` },
      { name: 'Bookshop.org', byIsbn: true, url: (q) => `https://bookshop.org/search?keywords=${q}` },
      { name: 'Barnes & Noble', byIsbn: true, url: (q) => `https://www.barnesandnoble.com/s/${q}` },
      { name: 'Booktopia', byIsbn: true, url: (q) => `https://www.booktopia.com.au/search.ep?keywords=${q}` },
      { name: 'AbeBooks (used copies)', byIsbn: true, url: (q) => `https://www.abebooks.com/servlet/SearchResults?kn=${q}` },
    ],
  },
  {
    group: 'Marketplaces',
    shops: [
      { name: 'Shopee', url: (q) => `https://shopee.sg/search?keyword=${q}` },
      { name: 'Lazada', url: (q) => `https://www.lazada.sg/catalog/?q=${q}` },
    ],
  },
  {
    group: 'Ebooks',
    shops: [
      { name: 'Google Play Books', url: (q) => `https://play.google.com/store/search?q=${q}&c=books` },
      { name: 'Kobo', url: (q) => `https://www.kobo.com/sg/en/search?query=${q}` },
      { name: 'Google Books', byIsbn: true, url: (q, book) => book.buyUrl || `https://www.google.com/search?tbm=bks&q=${q}` },
    ],
  },
  {
    group: 'Borrow it free',
    shops: [{ name: 'NLB libraries', url: (q) => `https://search.nlb.gov.sg/onesearch/Search?query=${q}` }],
  },
]

// [{ group, shops: [{ name, url }] }] for `book` ({ title, authors, isbn, buyUrl })
export function shopsFor(book) {
  const words = encodeURIComponent([book.title, book.authors?.[0]].filter(Boolean).join(' '))
  const isbn = book.isbn ? encodeURIComponent(book.isbn) : ''
  return SHOPS.map(({ group, shops }) => ({
    group,
    shops: shops.map((shop) => ({ name: shop.name, url: shop.url(shop.byIsbn && isbn ? isbn : words, book) })),
  }))
}
