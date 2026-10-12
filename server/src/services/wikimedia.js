// Quotes from a book, read from English Wikiquote through the Wikimedia Enterprise On-demand
// API. Called from the server only, so the account's password never reaches the browser.
// Docs: https://enterprise.wikimedia.com/docs/
//   login       POST https://auth.enterprise.wikimedia.com/v1/login  { username, password }
//   one article POST https://api.enterprise.wikimedia.com/v2/articles/{name}
// Wikiquote text is licensed CC BY-SA 4.0, so a quote is always shown with a link to its page.
import { readCache, writeCache } from "./cacheFile.js";
import { env } from "./env.js";

const LOGIN_URL = "https://auth.enterprise.wikimedia.com/v1/login";
const ARTICLES_URL = "https://api.enterprise.wikimedia.com/v2/articles";
const PROJECT = "enwikiquote";
const TIMEOUT_MS = 6000;
// a quote has to fit the recommendation popup and still say something
const MIN_LENGTH = 40;
const MAX_LENGTH = 280;
// sections of a Wikiquote page that do not hold lines from the work itself
const NOT_QUOTES = /\babout\b|external links|see also|misattributed|disputed|references|notes|cast|adaptations|taglines|sources/i;

export const hasWikimedia = () => Boolean(env.WIKIMEDIA_ENTERPRISE_USERNAME && env.WIKIMEDIA_ENTERPRISE_PASSWORD);

let token = { value: "", expiresAt: 0 };

// An access token lasts 24 hours: one login serves every request until shortly before then.
async function accessToken() {
  if (token.value && Date.now() < token.expiresAt) return token.value;

  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // the API wants the username in lowercase
      username: env.WIKIMEDIA_ENTERPRISE_USERNAME.toLowerCase(),
      password: env.WIKIMEDIA_ENTERPRISE_PASSWORD
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Wikimedia Enterprise login failed (${response.status})`);

  const data = await response.json();
  token = {
    value: data.access_token,
    expiresAt: Date.now() + ((data.expires_in || 86400) - 300) * 1000
  };
  return token.value;
}

// The Wikiquote page with this exact name as { name, url, wikitext }, or null if there is none.
async function fetchArticle(name, retry = true) {
  const response = await fetch(`${ARTICLES_URL}/${encodeURIComponent(name.replaceAll(" ", "_"))}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: [{ field: "is_part_of.identifier", value: PROJECT }],
      fields: ["name", "url", "article_body.wikitext"],
      limit: 1
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  // the token was revoked or ran out early: log in again, once
  if (response.status === 401 && retry) {
    token = { value: "", expiresAt: 0 };
    return fetchArticle(name, false);
  }
  if (!response.ok) return null;

  const [article] = await response.json();
  const wikitext = article?.article_body?.wikitext;
  if (!wikitext) return null;

  // a redirect page only names the page it points to
  const target = /^#REDIRECT\s*\[\[([^\]|#]+)/i.exec(wikitext.trim());
  if (target) return retry && !ADAPTATION.test(target[1].trim()) ? fetchArticle(target[1].trim(), false) : null;

  return { name: article.name, url: article.url, wikitext };
}

// a page about the film or the stage version does not quote the book
const ADAPTATION = /\((\d{4} )?(film|TV series|miniseries|musical|play|video game)\)$/i;

// Wiki markup -> the text a reader sees.
function plain(wikitext) {
  return wikitext
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
    .replace(/\[https?:\/\/\S+\]/g, "")
    .replace(/'{2,}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const words = (text) => String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// The quotes on a Wikiquote page as [{ text, headings }]. A quote is a first-level bullet
// ("* ..."); the deeper bullets under it say where it is from and are left out. `headings`
// are the titles of the sections the quote sits in, outermost first.
export function parseQuotes(wikitext) {
  const quotes = [];
  // headings[level] = title of the open section at that level
  let headings = [];

  for (const line of wikitext.split("\n")) {
    const heading = /^(={2,6})\s*(.+?)\s*\1\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      headings = headings.slice(0, level);
      headings[level] = plain(heading[2]);
      continue;
    }

    const bullet = /^\*(?![*:#])\s*(.+)$/.exec(line);
    // a bullet that opens with a web link is a "further reading" entry, not a quote
    if (!bullet || /^\[https?:/i.test(bullet[1])) continue;

    const open = headings.filter(Boolean);
    if (open.some((title) => NOT_QUOTES.test(title))) continue;

    const text = plain(bullet[1]);
    // leftover markup means a table, a template or a link this reader does not understand
    if (text.length < MIN_LENGTH || text.length > MAX_LENGTH || /[{}[\]|]/.test(text)) continue;
    quotes.push({ text, headings: open });
  }
  return quotes;
}

// "Dune (Movie Tie-In)" and "Walden: Or, Life in the Woods" are the pages "Dune" and "Walden"
const baseTitle = (title) => title.split(/[:(]/)[0].trim();

// Quotes already read, by "title|authors", as { url, quotes }, so asking for another quote
// costs no API call. Books that have quotes are also kept in
// server/data/wikiquote.cache.json, so a server start does not read their pages again.
const saved = readCache("wikiquote") || {};
const found = new Map(Object.entries(saved));

async function quotesFor(title, authors) {
  // The book's own page first, as Wikiquote names novels both ways. A title that is only the
  // author's name ("F. Scott Fitzgerald: The Great Gatsby") would open the author's page and
  // quote any of their books, so it is not tried.
  const isAuthor = authors.some((author) => words(author) === words(title));
  for (const name of isAuthor ? [] : [title, `${title} (novel)`]) {
    const article = await fetchArticle(name);
    const quotes = article ? parseQuotes(article.wikitext) : [];
    if (quotes.length) return { url: article.url, quotes: quotes.map((quote) => quote.text) };
  }

  // most books have no page of their own: their quotes are a section of the author's page
  const wanted = words(title);
  for (const author of authors) {
    const article = await fetchArticle(author);
    const quotes = article
      ? parseQuotes(article.wikitext).filter((quote) => quote.headings.some((heading) => words(heading).includes(wanted)))
      : [];
    if (quotes.length) return { url: article.url, quotes: quotes.map((quote) => quote.text) };
  }
  return { url: "", quotes: [] };
}

// A random quote from the book as { quoteText, sourceUrl }, or null when there is none to show
// (no account set, the API is unreachable, or Wikiquote has nothing for the book).
// `title` is the book's, as Google Books gives it. `authors` are spellings of the author's
// name to look for a page under: Google's ("Jerome K Jerome") is not always Wikiquote's.
export async function getBookQuote({ title, authors = [] }) {
  if (!hasWikimedia() || !title) return null;

  const base = baseTitle(title);
  const names = [...new Set(authors.filter(Boolean))];
  const key = `${words(base)}|${names.map(words).join(",")}`;

  try {
    if (!found.has(key)) {
      const result = await quotesFor(base, names);
      found.set(key, result);
      // a book with no quotes is remembered for this run only, in case the API was failing
      if (result.quotes.length) {
        saved[key] = result;
        writeCache("wikiquote", saved);
      }
    }

    const { url, quotes } = found.get(key);
    if (!quotes.length) return null;

    return { quoteText: quotes[Math.floor(Math.random() * quotes.length)], sourceUrl: url };
  } catch (err) {
    console.warn(`Wikimedia Enterprise: ${err.message}`);
    return null;
  }
}
