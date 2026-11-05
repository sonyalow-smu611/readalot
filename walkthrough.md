# Test scenarios: IKDA (readalot)

**Setup**
- Log in as the demo account: `demo@demo.ikda.app` / `Ikda-Demo-2026` / code `111111`.
- Reset the demo with `npm run seed:demo -w server` for a clean baseline.
- Start with Jordan: Level 4, 620 XP, 600 coins.
---

## 1. Map (town)

**Move around**
1. Tap empty pavement. Expect: character walks there.
2. Tap lake or building. Expect: character stops as close as possible.
3. Drag map. Pinch or scroll to zoom.
4. Press + and − buttons.
5. Press GPS icon. Expect: camera returns to character.
6. Tap a townsperson. Expect: jiggle.
7. Tap a building once. Expect: place card with Enter button.
8. Close card with ✕.

**Daily tasks**
1. Hover flame icon. Expect: "Daily task" label slides out.
2. Open Daily panel.
3. Check tasks: check-in ticked, three tasks, streak, 7-day reward tiles.
4. Press Go on a task. Expect: character flies to that building.
5. Finish all three tasks.
6. Press Claim. Expect: chest opens, coins fly, badge coins count up.

**Public / private chip**
1. Press chip.
2. Choose Go public. Allow or block location.
3. Press chip again.
4. Choose Stay private.

**Music**
1. Press music note button beside Daily.
2. Turn sound off. Expect: music and ambience stop.
3. Turn sound on.
4. Reload. Expect: choice remembered.

**Weather chip**
1. Press chip repeatedly.
2. Check day, night, rain, rainy night. Expect: lamps light at night, rain splashes.

**Profile badge shortcut**
1. Press badge (bottom left).
2. Expect: Hair Salon opens with cloud transition.
3. Check face ring shows XP, level tab shows level, coins show.

**Places dropdown**
1. Open Places.
2. Pick Your house. Expect: walk to door, door opens, My Room loads.
3. Return to town. Pick Library. Expect: Library loads.
4. Return. Pick Cafe. Expect: Cafe loads.
5. Return. Pick Hair Salon. Expect: Salon loads.
6. Check every link lands on the right feature.

**Notifications**
1. Press bell.
2. Read visit and request items.
3. Press Clear all. Expect: empty state.
4. Close bell.

**Friends panel**
1. Open Friends.
2. Check online count, requests, friends, nearby readers.
3. Accept a friend request. Expect: moves to Your friends.
4. Press Chat with a friend. Send a message. Minimise. Close.
5. Press Add friend. Type a wrong username. Expect: friendly error.
6. Type `priya.pagecount`. Expect: instant friend.
7. Tap a walking friend. Expect: friend card with Visit and Remove buttons.
8. Press Remove friends. Tick Priya. Confirm.

---

## 2. Library

**Lights and ambience**
1. Tap a wall lamp. Expect: off.
2. Tap lamp again. Expect: on.
3. Check weather through the windows.

**Move around**
1. Drag, swipe, scroll, or use ← →. Expect: hall slides sideways.
2. Open Places menu. Expect: Help desk, Scanner, Reading nook, all shelves.
3. Press each place. Expect: hall slides there.
4. Press Esc to close.

**Help desk search**
1. Press search bar.
2. Type the start of a title, like `hob`. Press Search.
3. Check results page. Open a result.
4. Press browser Back. Reload.
5. Search `zzzqqq`. Expect: "nothing found".

**Scanner**
1. Open Scanner.
2. Allow camera. Hold a cover up. Press Snap cover.
3. Expect: Scanning…, then book card opens.
4. Repeat by uploading a cover photo.
5. Block camera. Expect: upload or title search fallback.
6. Close scanner.

**Genre shelves**
1. Open Bestsellers.
2. Open Romance.
3. Open Romantasy.
4. Open Fantasy.
5. Open Mystery & Thriller.
6. Open Horror.
7. Open Sci-Fi.
8. Open Historical Fiction.
9. Open Young Adult.
10. Open Memoir.
11. Open Graphic Novels.
12. Check each sign, colour, and books.

**Shelf visuals**
1. Open one shelf.
2. Switch to Spines. Expect: spine view.
3. Switch to Covers. Expect: cover view.
4. Hover a book. Expect: slides out.
5. Repeat on three other shelves.

**Book card**
1. Open a book.
2. Check cover, title, author, stars, genres, synopsis.
3. Press Where to get. Check links.
4. Press Add to To be read. Expect: button changes, toast shows.
5. Press the shelf button again to change status.
6. Open full book page.
7. Press Leave/Read Reviews.
8. Pick 5 stars. Type a review. Post.
9. Check review appears.
10. Edit review. Delete review.
11. Close card.

---

## 3. Friend cafe

**Enter and look**
1. Enter Cafe.
2. Check reader count, name tags, match scores.
3. Check weather and welcome mat.

**First friend**
1. Click Emma Tan. Expect: character walks over.
2. Open profile popup.
3. Check match %, Currently Reading, Reading Prefs, shared books.
4. Press Add friend, or Added as friend if already friends.
5. Press Message. Send a message.
6. Close chat.

**Second friend**
1. Click another reader, like Daniel Ong.
2. Check profile popup.
3. Press Add friend. Expect: Request sent.
4. Press Message. Send a message.
5. Close popup.

**Visit their room**
1. Press Visit [name]'s room.
2. Expect: "Knocking…" then their room.
3. Move around room.
4. Tap lamp. Expect: lights toggle for your visit only.

**View bookshelf (read-only)**
1. Open their bookshelf.
2. Check no search, no status buttons.
3. Open a book card. Check description and buttons.
4. Try dragging a book. Expect: cannot move.
5. Try editing the shelf. Expect: blocked.

**Noticeboard**
1. Click noticeboard.
2. Read notes and Quote of the Day.
3. Press Leave a note. Type a note. Post.
4. Check note appears. Check +XP.
5. Delete your own note.

**Furniture lock**
1. Tap their furniture. Expect: no edit.
2. Look for shop or inventory. Expect: none.
3. Press Back to profile. Press Back to town.

---

## 4. Own room (house)

**Look around**
1. Enter house.
2. Move around room.
3. Open Places. Visit window, chair, bookshelf, clock, corkboard, bed.
4. Check window weather.
5. Check cats wandering.

**Lights**
1. Tap floor lamp. Expect: off.
2. Tap table lamp. Expect: off.
3. Tap both again. Expect: on.

**Bookshelf**
1. Open My Shelf.
2. Drag a book to another shelf. Expect: shelf glows, status changes.
3. Press Esc mid-drag. Expect: book returns.
4. Press a genre chip. Expect: books filter.
5. Clear chip.
6. Search your books.
7. Search `zzzz`. Expect: empty state.
8. Switch Spines and Covers.
9. Open a book description card.
10. Check all buttons: progress slider, Mark as finished, Remove, Reviews.
11. Press Back to room.

**Shop**
1. Open Shop.
2. Check coin total.
3. Buy a poster. Confirm. Place on wall.
4. Buy a plant. Place on floor.
5. Buy a succulent. Place on a side table.
6. Try a wrong spot. Expect: refused, hint shown.
7. Check coins dropped.

**Inventory and placing**
1. Open Inventory.
2. Place Calico cat on floor. Expect: wanders.
3. Place Moon poster on wall.
4. Select a placed piece. Use arrows to move. Press Done.
5. Press Cancel on another move. Expect: reverts.

**Fixed replacements**
1. Place Rocking chair. Expect: swaps with Wingback, old goes to Inventory.
2. Place Navy curtains. Expect: replace sage curtains.
3. Place Tartan bedding. Expect: replace starry bedding.

**Coins limit**
1. Keep buying until coins run low.
2. Pick an unaffordable item.
3. Expect: "Not enough credits", Confirm greyed, coins never negative.

**Earn coins**
1. Open Daily. Finish all three tasks. Press Claim.
2. Check coins increased.
3. Read a book: open a book in Reading, drag progress slider.
4. Press Mark as finished.
5. Check +100 XP.
6. Check level-up coins.
7. Post a review. Check +40 XP.
8. Open Shop. Check coins and buy again.
9. Reload. Expect: placements and coins persist.

**Mood and quotes**
1. Open mood check-in.
2. Check Continue greyed until a mood is picked.
3. Pick Calm, Low, Stressed, Excited in turn.
4. Press Continue. Check book and quote.
5. Press Save quote. Expect: becomes Unsave.
6. Press Add to To Be Read. Press Undo.
7. Press Show another recommendation.
8. Close. Try Skip for today next day.
9. Open corkboard.
10. Read Quote of the Day.
11. Save the quote.
12. Read friends' notes.

---

## 5. Profile (hair salon)

**Style studio**
1. Open Salon.
2. Check mirror reflection.
3. Press Looks. Pick each preset.
4. Press Surprise me.
5. Change Hair style and colour.
6. Change Skin tone.
7. Change Top, colour, bottoms, shoes.
8. Change Extras: glasses, hat, accessory, scarf, earrings, bag.
9. Check clash messages.
10. Press Reset. Expect: saved look returns.
11. Change again. Press Save look. Expect: confetti.
12. Change hair. Press Back to town. Expect: save dialog.
13. Test Save and leave, Stay, Discard.

**Profile details**
1. Open Profile tab.
2. Press Edit profile.
3. Edit name.
4. Change gender.
5. Change religion.
6. Type bad age (`abc`, `-5`). Expect: refused.
7. Type valid age.
8. Add favourite genres.
9. Remove a genre.
10. Save. Expect: updates on card and badge.
11. Edit another field. Press Cancel. Expect: dropped.
12. Press Change look. Expect: opens Style studio.
13. Use single-field pencil on About you.

**Privacy**
1. Turn Public on. Expect: character cheers.
2. Turn Public off. Expect: character puts on mask.

**XP and levels**
1. Note starting XP and coins.
2. Press How to earn XP.
3. Do actions: visit a room, leave a note, send a message, add a book, finish a book, post a review.
4. Return to Profile.
5. Check XP counts up.
6. Check progress bar fills.
7. Cross a level boundary. Expect: level rises.
8. Check coins increase at level-up.
9. Check badge in town matches.

**Reading tracking**
1. Press To be read on reader card. Check list.
2. Press Reading. Check list.
3. Press Finished. Check list.
4. Remove a book from a list.
5. Check counts update.
6. Check empty shelf message.

**Saved quotes**
1. Scroll to Saved quotes.
2. Check old and new quotes.
3. Remove one quote.
4. Remove all. Expect: empty state with shortcuts.
5. Save a quote again. Check it returns.

**Finish**
1. Press Visit the shop. Expect: opens room shop.
2. Press Log out. Press Stay. Press Log out again.
3. Press browser Back. Expect: no access.