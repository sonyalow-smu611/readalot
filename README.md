<!-- Scaffolded with AI assistance — see AI_USAGE.md -->
# IKDA

**Social media, but for book lovers.** IKDA (읽다, Korean for "to read") is a mobile-first web app
by **Group 16 · Bangtan Warriors** (IS216).

## Links

| | |
|---|---|
| **Open the app** | <https://ikda-rust.vercel.app/register> |
| **Landing page** | <https://ikda-rust.vercel.app/start> |
| **Pitch video (YouTube)** | <https://www.youtube.com/watch?v=d5RvL3CJkto> |
| **Code** | <https://github.com/sonyalow-smu611/readalot> |

## Purpose

Young readers often read alone, so it's hard for them to find people with the same taste or to
keep up a reading habit. Today's reading apps are mostly plain book trackers, and their design
doesn't keep readers coming back.

IKDA turns reading into a game you play with other readers. You track and find books in a playful
pixel-art town, meet like-minded readers by visiting each other's rooms, leaving notes and sharing
recommendations, and earn XP, coins and daily streaks that keep you reading.

## The town

After signing in you land in a pixel-art town. Each building is one part of the app:

| Building | Part of the app | What you do there |
|---|---|---|
| Your house | **My Room** | Your own room: bookshelf, reading progress, shop, decorations |
| Library | **Discover** | Browse genre bookcases, search, scan a cover, add books to your shelf |
| Cafe | **Social** | Meet readers, view their profiles, add friends, message, visit rooms |
| Hair Salon | **Profile** | Restyle your character, edit your profile, level, coins, privacy |

## Features at a glance

| | What you can do |
|---|---|
| **Connect** | Find friends by username or meet readers nearby on the town map and in the Cafe. See your match score and shared genres, add friends, and chat in a box you can tuck away while you explore. The bell tells you about friend requests, friends coming online and visits to your room. |
| **Visit** | Walk into a friend's room, browse their To be read, Currently reading and Finished reading shelves, and pin a note on their notice board. |
| **Discover** | In the Library, search for any book or ask the help desk, scan a cover, or browse genre bookcases and this week's bestsellers. Each book shows its synopsis, reviews and where to get it, and you can add it to To be read. |
| **Read and progress** | Update how far you are with a slider, or drag a book to another shelf. Finishing a book earns 100 XP, levelling up earns coins, and daily tasks build a streak with rewards to claim. Rate and review what you've read. |
| **Personalise** | Spend coins in the Shop on cats, plants, posters and furniture, place them in your room, and restyle your character in the Hair Salon (or let **Surprise me** pick a look). |

## Built with

Vue 3, Bootstrap 5 and Phaser 3 (the town map), with an Express and Supabase backend.
Books come from Google Books and Open Library, bestsellers from the New York Times. To run it
yourself, see [docs/DEVELOPER.md](docs/DEVELOPER.md).

## The team

| Part | Owner |
|---|---|
| Town | Dylan |
| My Room | Sonz |
| Library | Aasim |
| Cafe | Emiley |
| Hair Salon, sign-in | Aalric |

### AI usage

We used AI coding assistants (mainly Claude Code, plus Cursor and Codex) for boilerplate, pixel art,
layouts, mock data and test upkeep. With the team's agreement, AI also wrote these parts: the room's
decoration placing, Supabase sign-in and profiles, nearby readers and friends, the reviews and room
notes endpoints, town notifications and tap to walk, the library's Bestsellers bookcase, and daily
tasks in Supabase. Every AI-written file starts with a comment pointing to
[AI_USAGE.md](AI_USAGE.md), which lists what AI produced in each part.


## Credits

### Music credits

Background music from https://www.FesliyanStudios.com (free for non-commercial use, with credit):

| Place | Track |
|---|---|
| Town (home page) | News Chill, by Steve Oxen |
| My Room | Talk To Me, by David Renda |
| Library | Morning Refresher, by Steve Oxen |
| Cafe | The Lounge, by David Renda |
| Hair Salon | Swinging Sixties, by Steve Oxen |

Sound effects are CC0 (public domain): button clicks and the "off you go" pop from Kenney's Interface Sounds, footsteps on grass and pavement from Kenney's Impact Sounds, and the door from Kenney's RPG Audio with a bell from "100 CC0 SFX" (OpenGameArt).

Background sounds follow the live weather, also CC0 from OpenGameArt: rain ("Rain (loopable)" by Ylmir), a thunderstorm ("Rain, long thunder"), rain on the window indoors ("Rain on Window Loop"), birdsong on sunny days ("Ambient Bird Sounds" by isaiah658), a breeze when cloudy ("Park ambiences"), crickets at night ("Crickets ambient noise, loopable"), and cups clinking in the cafe ("100 CC0 SFX").
