// Builds server/data/quotes.json, the list Quote of the Day picks from, out of the
// "Goodreads Quotes" dataset on Kaggle (abdokamr/good-reads-quotes: one CSV per topic, each a
// single `quotes` column, most-liked quotes first).
//
// Usage: download the dataset, then
//   npm run import-quotes -w server -- <folder with the CSV files>
//
// Only part of the dataset is kept: the topics that suit a reading room, quotes short enough
// to read on the note's popup, and nothing with coarse language. Change the constants below
// and re-run to keep more or less.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// file quotes_of_<topic>.csv -> label shown under the quote
const TOPICS = {
  books: "books",
  writing: "writing",
  poetry: "poetry",
  knowledge: "knowledge",
  wisdom: "wisdom",
  hope: "hope",
  happiness: "happiness",
  inspirational: "inspiration",
  life: "life",
  time: "time"
};
const PER_TOPIC = 100;
const MIN_LENGTH = 20;
const MAX_LENGTH = 220;
const COARSE =
  /\b(fuck|shit|bitch|bastard|asshole|damn|whore|slut|sex|porn|rape|cunt|dick|cock|pussy|nigg|fag|suicid)\w*/i;

const OUTPUT = fileURLToPath(new URL("../data/quotes.json", import.meta.url));

// Minimal CSV reader: quoted fields may hold commas, line breaks and doubled quotes ("").
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

// Mostly non-Latin text would need fonts and a reading direction the popup is not set up for.
function isLatin(text) {
  const letters = [...text].filter((char) => /\p{L}/u.test(char));
  const latin = letters.filter((char) => /\p{Script=Latin}/u.test(char));
  return letters.length > 0 && latin.length / letters.length > 0.9;
}

function keep(text) {
  return (
    text.length >= MIN_LENGTH &&
    text.length <= MAX_LENGTH &&
    !text.includes("\n") &&
    isLatin(text) &&
    !COARSE.test(text)
  );
}

const folder = process.argv[2];
if (!folder) {
  console.error("Usage: npm run import-quotes -w server -- <folder with the CSV files>");
  process.exit(1);
}

const files = new Set(readdirSync(folder));
const seen = new Set();
const quotes = [];

for (const [topic, label] of Object.entries(TOPICS)) {
  const file = `quotes_of_${topic}.csv`;
  if (!files.has(file)) {
    console.warn(`Skipped ${topic}: ${file} is not in ${folder}`);
    continue;
  }

  const [header, ...rows] = parseCsv(readFileSync(join(folder, file), "utf8"));
  const column = header.indexOf("quotes");
  let kept = 0;

  for (const row of rows) {
    if (kept === PER_TOPIC) break;
    const text = (row[column] || "").trim();
    // the same quote is often filed under several topics: the first topic keeps it
    const key = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");
    if (!keep(text) || seen.has(key)) continue;
    seen.add(key);
    quotes.push({ quoteText: text.replace(/\s+/g, " "), topic: label });
    kept += 1;
  }
  console.log(`${topic}: kept ${kept} of ${rows.length}`);
}

writeFileSync(OUTPUT, `${JSON.stringify(quotes, null, 1)}\n`);
console.log(`Wrote ${quotes.length} quotes to ${OUTPUT}`);
