// Scaffolded with AI assistance — see AI_USAGE.md
// The IKDA landing page: the sky that turns from morning to night as you scroll, scenes that
// fade in and out in both directions, the section links, the drifting town map, the places in
// town, and an XP ring that uses the app's own level and coin rules.

// Where "Try IKDA free" goes: the app's sign-up page. Change this when the app is deployed.
const APP_URL = 'http://localhost:5173/register';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

document.querySelectorAll('[data-app-link]').forEach((link) => {
  link.href = APP_URL;
});

// ---- the sky: morning, day, golden hour, sunset, then night at the bottom ------------------

const SKY = [
  { at: 0, top: [143, 208, 239], bottom: [217, 240, 247] },
  { at: 0.45, top: [124, 196, 234], bottom: [205, 234, 244] },
  { at: 0.74, top: [255, 209, 138], bottom: [251, 227, 184] },
  { at: 0.88, top: [240, 160, 122], bottom: [246, 200, 154] },
  { at: 1, top: [29, 33, 64], bottom: [58, 47, 92] },
];

function mix(a, b, t) {
  return a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));
}

function paintSky(progress) {
  let from = SKY[0];
  let to = SKY[SKY.length - 1];
  for (let i = 0; i < SKY.length - 1; i += 1) {
    if (progress >= SKY[i].at && progress <= SKY[i + 1].at) {
      from = SKY[i];
      to = SKY[i + 1];
      break;
    }
  }
  const t = to.at === from.at ? 0 : (progress - from.at) / (to.at - from.at);
  const root = document.documentElement.style;
  root.setProperty('--sky-top', `rgb(${mix(from.top, to.top, t).join(',')})`);
  root.setProperty('--sky-bottom', `rgb(${mix(from.bottom, to.bottom, t).join(',')})`);
  root.setProperty('--night', clamp((progress - 0.88) / 0.12, 0, 1).toFixed(3));
}

// ---- scenes: each fades in as it comes up the screen and out as it leaves, either way ------

const scenes = [...document.querySelectorAll('.scene')];
const links = [...document.querySelectorAll('.bar__nav a')];

function fadeScenes() {
  const vh = window.innerHeight;
  let current = null;
  let best = 0;
  for (const scene of scenes) {
    const box = scene.getBoundingClientRect();
    // in as its top rises from 85% to 40% of the screen; out as its bottom falls from 60% to 15%
    const enter = clamp((vh * 0.85 - box.top) / (vh * 0.45), 0, 1);
    const leave = clamp((box.bottom - vh * 0.15) / (vh * 0.45), 0, 1);
    const shown = Math.min(enter, leave);
    if (shown > best) {
      best = shown;
      current = scene.id;
    }
    if (reduceMotion) continue;
    const inner = scene.querySelector('.scene__inner');
    const rise = (1 - enter) * 48 - (1 - leave) * 48;
    inner.style.opacity = shown.toFixed(3);
    inner.style.transform = `translateY(${rise.toFixed(1)}px) scale(${(0.97 + shown * 0.03).toFixed(4)})`;
  }
  for (const link of links) {
    link.setAttribute('aria-current', link.getAttribute('href') === `#${current}` ? 'true' : 'false');
  }
}

let queued = false;
function onScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    const room = document.documentElement.scrollHeight - window.innerHeight;
    paintSky(room > 0 ? clamp(window.scrollY / room, 0, 1) : 0);
    fadeScenes();
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// ---- the hero's town map drifts a little with the pointer --------------------------------

const hero = document.querySelector('.scene--hero');
const map = document.querySelector('.hero__map');
if (!reduceMotion && hero && map) {
  hero.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * -36;
    const y = (event.clientY / window.innerHeight - 0.5) * -24;
    map.style.setProperty('--px', `${x.toFixed(1)}px`);
    map.style.setProperty('--py', `${y.toFixed(1)}px`);
  });
}

// ---- the places in town ------------------------------------------------------------------

// Each place: a short title, one line on what it is for, and its features, each led by its name.
const PLACES = {
  cafe: {
    title: 'The cafe',
    body: 'Where you meet other readers.',
    list: [
      ['Reading match', 'see how closely each reader’s books and genres match yours.'],
      ['Follow readers', 'keep the ones you click with, and visit their rooms.'],
      ['Chat', 'say hi and talk books in a quick message.'],
    ],
    shot: 'assets/shot-cafe.jpg',
    alt: 'The cafe in IKDA, with a reader card showing Emma Tan, a 57% reading match',
    caption: 'Emma is a 57% reading match.',
  },
  house: {
    title: 'Your house',
    body: 'Your own room, with your books in it.',
    list: [
      ['Bookshelf', 'sort your books into To read, Reading and Finished.'],
      ['Decorate', 'buy furniture, plants and cats in the Shop with your coins.'],
      ['Notes', 'visit friends’ rooms and pin a note on their board.'],
      ['Mood check-in', 'say how you feel and get a book picked for you.'],
    ],
    shot: 'assets/shot-room.jpg',
    alt: 'A friend’s room in IKDA with a note being written: Your shelf is goals. Swap books?',
    caption: 'Leaving a note on Emma’s board.',
  },
  library: {
    title: 'The library',
    body: 'Where you find your next read.',
    list: [
      ['Browse', 'bookcases for fantasy, romance, mystery, sci-fi and more.'],
      ['Search', 'look up any title or author.'],
      ['Scan a cover', 'point your camera at a book to put it on your shelf.'],
    ],
    shot: 'assets/shot-library.jpg',
    alt: 'The IKDA library hall, with bookcases, the help desk and the book scanner',
    caption: 'The hall, with the help desk and the scanner.',
  },
  salon: {
    title: 'The hair salon',
    body: 'Where you make your character and profile yours.',
    list: [
      ['Style', 'try on hair, colours and outfits in the mirror before you save.'],
      ['Profile', 'edit your name, favourite genres and saved quotes.'],
      ['Privacy', 'choose whether other readers can find you on the map.'],
    ],
    shot: 'assets/shot-salon.jpg',
    alt: 'The IKDA hair salon, with Mia trying on a new hairstyle in front of the mirror',
    caption: 'Mia trying a new look.',
  },
};

// Swaps what a panel shows, smoothly: fade the old content out, change it, ease the panel to its
// new height, fade the new content in. A newer swap cancels an older one still in progress.
function crossfade(panel, change) {
  const run = (panel.swaps = (panel.swaps || 0) + 1);
  if (reduceMotion) {
    change();
    return;
  }
  const from = panel.offsetHeight;
  panel.style.height = `${from}px`;
  panel.classList.add('is-fading');
  window.setTimeout(async () => {
    if (run !== panel.swaps) return;
    await change();
    if (run !== panel.swaps) return;
    panel.style.height = 'auto';
    const to = panel.offsetHeight;
    panel.style.height = `${from}px`;
    void panel.offsetHeight;
    panel.style.height = `${to}px`;
    panel.classList.remove('is-fading');
    window.setTimeout(() => {
      if (run === panel.swaps) panel.style.height = '';
    }, 300);
  }, 220);
}

const tabs = [...document.querySelectorAll('.place')];
const inside = document.getElementById('panel-place');

function fillPlace(place) {
  inside.querySelector('[data-field="title"]').textContent = place.title;
  inside.querySelector('[data-field="body"]').textContent = place.body;
  const list = inside.querySelector('[data-field="list"]');
  list.replaceChildren(
    ...place.list.map(([feature, text]) => {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      name.textContent = feature;
      item.append(name, `: ${text}`);
      return item;
    }),
  );
  inside.querySelector('[data-field="caption"]').textContent = place.caption;
  const shot = inside.querySelector('[data-field="shot"]');
  shot.alt = place.alt;
  if (shot.getAttribute('src') === place.shot) return Promise.resolve();
  shot.src = place.shot;
  // shown once it has loaded, so there's never a blank frame
  return shot.decode().catch(() => {});
}

function showPlace(tab, { focus = false, smooth = true } = {}) {
  if (tab.getAttribute('aria-selected') === 'true' && smooth) return;
  const place = PLACES[tab.dataset.place];
  for (const other of tabs) {
    const on = other === tab;
    other.setAttribute('aria-selected', String(on));
    other.tabIndex = on ? 0 : -1;
  }
  inside.setAttribute('aria-labelledby', tab.id);
  if (focus) tab.focus();
  if (smooth) crossfade(inside, () => fillPlace(place));
  else fillPlace(place);
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => showPlace(tab));
  // arrow keys move along the street, like any tab list
  tab.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    showPlace(tabs[(i + step + tabs.length) % tabs.length], { focus: true });
  });
});
showPlace(tabs[0], { smooth: false });

// ---- the XP ring: the same rules as the app (client/src/lib/levels.js) -------------------

const START_COINS = 480;
const RING = 2 * Math.PI * 52;

function xpForLevel(level) {
  const n = level - 1;
  return 100 * n + 25 * n * (n - 1);
}

function levelFor(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

const badge = document.querySelector('.badge');
const fill = document.querySelector('.ring__fill');
const out = {
  level: document.querySelector('[data-level]'),
  xp: document.querySelector('[data-xp-total]'),
  next: document.querySelector('[data-xp-next]'),
  coins: document.querySelector('[data-coins]'),
  toast: document.querySelector('[data-toast]'),
};
let xp = 0;
let coins = START_COINS;

function render() {
  const level = levelFor(xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  fill.style.strokeDasharray = RING.toFixed(2);
  fill.style.strokeDashoffset = (RING * (1 - (xp - from) / (to - from))).toFixed(2);
  out.level.textContent = level;
  out.xp.textContent = xp;
  out.next.textContent = `${to - xp} XP to level ${level + 1}`;
  out.coins.textContent = coins;
}

function toast(text) {
  out.toast.textContent = text;
  out.toast.classList.remove('is-on');
  void out.toast.offsetWidth;
  out.toast.classList.add('is-on');
}

function confetti() {
  if (reduceMotion) return;
  const colours = ['#f6e27a', '#d0608e', '#3fae5a', '#2f5fb3'];
  for (let i = 0; i < 22; i += 1) {
    const bit = document.createElement('span');
    bit.className = 'confetti';
    const angle = (i / 22) * Math.PI * 2;
    const reach = 90 + Math.random() * 90;
    bit.style.left = '50%';
    bit.style.top = '34%';
    bit.style.background = colours[i % colours.length];
    bit.style.setProperty('--dx', `${Math.cos(angle) * reach}px`);
    bit.style.setProperty('--dy', `${Math.sin(angle) * reach + 40}px`);
    bit.style.setProperty('--spin', `${Math.random() * 540}deg`);
    badge.append(bit);
    bit.addEventListener('animationend', () => bit.remove());
  }
}

document.querySelectorAll('[data-xp]').forEach((button) => {
  button.addEventListener('click', () => {
    const gained = Number(button.dataset.xp);
    const before = levelFor(xp);
    xp += gained;
    const after = levelFor(xp);
    // each new level gives 25 x that level in coins
    let bonus = 0;
    for (let level = before + 1; level <= after; level += 1) bonus += 25 * level;
    coins += bonus;
    render();
    if (after > before) {
      toast(`Level ${after}! +${bonus} coins`);
      badge.classList.remove('is-levelling');
      void badge.offsetWidth;
      badge.classList.add('is-levelling');
      confetti();
    } else {
      toast(`+${gained} XP`);
    }
  });
});

document.querySelector('[data-xp-reset]').addEventListener('click', () => {
  xp = 0;
  coins = START_COINS;
  render();
});

render();

// ---- your character: made in the studio, then everywhere on the page --------------------

const A = window.IKDAAvatar;
const SAVE_KEY = 'ikda-landing-me';

function loadMe() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved?.character) return { name: String(saved.name || '').slice(0, 16), character: A.normaliseCharacter(saved.character) };
  } catch {
    // no storage (private window, blocked site data): start fresh
  }
  return { name: '', character: A.presetCharacter('maya') };
}

const me = loadMe();

function saveMe() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(me));
  } catch {
    // the page still works; the look just isn't remembered
  }
}

// Draws a character onto a canvas: the whole sprite (30 x 58) or just the head (30 x 25).
function paint(canvas, character, crop = 'full') {
  const valid = A.normaliseCharacter(character, { allowLocked: true });
  const sprite = A.drawAvatar(A.toDrawParams(valid), A.makeRnd(A.characterSeed(valid)));
  const height = crop === 'head' ? 25 : 58;
  canvas.width = 30;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, 30, height);
  context.drawImage(sprite, 0, 0, 30, height, 0, 0, 30, height);
}

const big = document.querySelector('[data-me-big]');
const nameInput = document.querySelector('[data-me-name]');

function showMe({ hop = false } = {}) {
  paint(big, me.character);
  big.setAttribute('aria-label', `Your character: ${A.describeCharacter(me.character)}`);
  document.querySelectorAll('[data-me-face]').forEach((canvas) => paint(canvas, me.character, 'head'));
  document.querySelectorAll('[data-me-small]').forEach((canvas) => paint(canvas, me.character));
  document.querySelectorAll('[data-me-tag]').forEach((tag) => {
    tag.textContent = me.name || 'You';
  });
  if (hop && !reduceMotion) {
    big.classList.remove('is-hopping');
    void big.offsetWidth;
    big.classList.add('is-hopping');
  }
}

nameInput.value = me.name;
nameInput.addEventListener('input', () => {
  me.name = nameInput.value.trim().slice(0, 16);
  saveMe();
  showMe();
});

// ---- the studio: the same free parts the app offers --------------------------------------

const options = document.getElementById('you-options');
const studioTabs = [...document.querySelectorAll('.you__tabs [role="tab"]')];
let studioTab = 'looks';

const free = (slot) => A.CATALOGUE[slot].filter(A.isUnlocked);

function choose(slot, id) {
  me.character = A.applyChoice(me.character, slot, id);
  saveMe();
  showMe({ hop: true });
  renderOptions();
}

function group(label, children) {
  const box = document.createElement('div');
  box.className = 'you__group';
  const title = document.createElement('p');
  title.className = 'you__label';
  title.textContent = label;
  const row = document.createElement('div');
  row.className = 'you__row';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', label);
  row.append(...children);
  box.append(title, row);
  return box;
}

// a picture-and-name button: a whole look, or a hair style shown on your own head
function pick(label, character, pressed, onPick, head = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = head ? 'pick pick--head' : 'pick';
  button.setAttribute('aria-pressed', String(pressed));
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  paint(canvas, character, head ? 'head' : 'full');
  const name = document.createElement('span');
  name.textContent = label;
  button.append(canvas, name);
  button.addEventListener('click', onPick);
  return button;
}

function swatches(slot, colour = (item) => item.c) {
  return free(slot).map((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.style.setProperty('--c', colour(item));
    button.setAttribute('aria-label', item.label);
    button.setAttribute('aria-pressed', String(me.character[slot] === item.id));
    button.addEventListener('click', () => choose(slot, item.id));
    return button;
  });
}

function styles(slot, head) {
  return free(slot).map((item) =>
    pick(item.label, A.applyChoice(me.character, slot, item.id), me.character[slot] === item.id, () => choose(slot, item.id), head),
  );
}

function renderOptions() {
  let groups = [];
  if (studioTab === 'looks') {
    groups = [
      group(
        'Start from a look',
        A.PRESETS.map((preset) =>
          pick(preset.label, A.presetCharacter(preset.id), me.character.base === preset.id, () => {
            me.character = A.presetCharacter(preset.id);
            saveMe();
            showMe({ hop: true });
            renderOptions();
          }),
        ),
      ),
    ];
  } else if (studioTab === 'hair') {
    groups = [group('Hair style', styles('hair', true)), group('Hair colour', swatches('hairColour'))];
  } else if (studioTab === 'skin') {
    groups = [group('Skin tone', swatches('skin', (item) => item.skin))];
  } else {
    groups = [group('Top', styles('top', false)), group('Top colour', swatches('topColour')), group('Bottoms colour', swatches('bottomColour'))];
  }
  options.replaceChildren(...groups);
}

function showStudioTab(tab, focus = false) {
  if (tab.dataset.tab === studioTab) return;
  studioTab = tab.dataset.tab;
  for (const other of studioTabs) {
    const on = other === tab;
    other.setAttribute('aria-selected', String(on));
    other.tabIndex = on ? 0 : -1;
  }
  options.setAttribute('aria-labelledby', tab.id);
  crossfade(options, renderOptions);
  if (focus) tab.focus();
}

studioTabs.forEach((tab, i) => {
  tab.addEventListener('click', () => showStudioTab(tab));
  tab.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    showStudioTab(studioTabs[(i + step + studioTabs.length) % studioTabs.length], true);
  });
});

document.querySelector('[data-me-random]').addEventListener('click', () => {
  me.character = A.randomCharacter(me.character.base);
  saveMe();
  showMe({ hop: true });
  renderOptions();
});

showMe();
renderOptions();

// ---- night: the houses light up one by one when the last section comes into view --------

const town = document.querySelector('.end__town');
if ('IntersectionObserver' in window && town) {
  new IntersectionObserver(
    ([entry]) => town.classList.toggle('is-lit', entry.isIntersecting),
    { threshold: 0.45 },
  ).observe(town);
} else if (town) {
  town.classList.add('is-lit');
}
