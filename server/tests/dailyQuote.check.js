// Assert-style check for the Quote of the Day picker. Run: npm run check -w server
import assert from "node:assert/strict";
import { pickDailyQuote } from "../src/services/dailyQuote.js";

const list = Array.from({ length: 1000 }, (_, index) => ({ quoteText: `quote ${index}`, topic: "books" }));
const at = (stamp) => pickDailyQuote(list, new Date(stamp));

// the same quote all day in Singapore (UTC+8): 00:00 and 23:59 on 1 Jan 2026
assert.equal(at("2025-12-31T16:00:00Z"), at("2026-01-01T15:59:00Z"));
// and a new one once the Singapore date changes
assert.notEqual(at("2026-01-01T15:59:00Z"), at("2026-01-01T16:00:00Z"));

// no quote comes round again until the whole list has been shown
const start = Date.parse("2026-01-01T04:00:00Z");
const shown = new Set(list.map((_, day) => at(start + day * 86400000).quoteText));
assert.equal(shown.size, list.length);

// a list whose length the step divides still cycles through everything
const awkward = Array.from({ length: 7919 }, (_, index) => ({ quoteText: `quote ${index}` }));
assert.notEqual(pickDailyQuote(awkward, new Date(start)), pickDailyQuote(awkward, new Date(start + 86400000)));

assert.equal(pickDailyQuote([], new Date(start)), null);

console.log("dailyQuote checks passed");
