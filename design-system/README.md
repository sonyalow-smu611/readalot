# Readalot

Warm, bookish, mobile-first UI: parchment canvas, walnut-brown primary, olive ink and sage. Palette from the team's two Coolors palettes. Bootstrap 5 supplies grid, utilities and modals; these tokens override its variables.

## Using the tokens
- Page background `canvas`; cards, header, modals, inputs `surface`. Body text `text`; captions `muted` (12px and up only).
- One `primary` action per screen (filled `primary` walnut, text `surface`); everything quieter uses `secondary` fill with `text`. Toggle groups (reading status Want / Reading / Read): selected `primary`, others outline.
- `accent` is for icons, progress fill and large text only (about 2.5:1 on canvas). `sage` marks the Reading Match badge and success; `clay` is the warm highlight. `muted` is about 4.3:1: 14px+ or bold only. `placeholder` and `disabled` are never text colors.
- The pixel look, from My Room's sprites: cards, buttons, tags, inputs and modals are square with a 2px `outline` border; raised ones (cards, buttons, modals) cast the hard `shadow-card` / `shadow-modal` (3px, no blur). Dividers inside cards stay 1px `line` / `line-soft`.
- Arial (`sans`) is the only family; titles, card titles, tags and buttons are Arial bold, like the pixel buttons. Styles: `title-lg/md/sm`, `body`, `body-strong`, `caption`, `label`.
- Radii: book covers `radius-sm`; everything else is square (`radius-md`, `radius-lg`, `radius-pill` are 0).
- In the app these live in `client/src/assets/theme.css` (`--rl-font-title`), `client/src/styles/pixel-buttons.css` and `client/src/styles/pixel-surfaces.css`. Spacing steps `space-1`…`space-8`; page gutter `space-4`.
- Layout: centred column max 430px on `canvas`; five bottom tabs (Home, Discover, People, Scan, Profile) with about 72px bottom padding.
- Book covers are always 2:3, 88px wide in carousels, with the title centred on `placeholder` when there is no image.

## Voice
Sentence case, short verbs (Scan, Retry, Skip for today). Moods: Calm, Low, Stressed, Excited. Compatibility reads "NN% Reading Match". Empty and error states say what to do next.

## Components
Button, Chip, BookCover, Card, BottomNav, Modal: see each folder's README.

## Not synced
Source: github.com/sonyalow-smu611/readalot @ main f99e0a2. The committed `client/src/assets/theme.css` still defines the legacy theme (ink `#241f1b`, paper `#fffaf2`, leaf `#386641`, berry `#9d3150`, Bootstrap `btn-success` green); the tokens above come from the team's Coolors palettes (the SPEC's older brown values are superseded) and are the intended replacement. `surface` `#fffdf9` is the one value not in the palettes. No font files, logos or icons exist in the repo (system fonts only). No components bundle: the client is Vue, so components are documented with static previews only.
