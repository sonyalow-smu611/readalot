# Button
Pixel action button, like My Room's sprites: square, a 2px `outline` border, a light top band and dark bottom band, and a hard `shadow-card` it presses into (`shadow-pressed`). At least 44px tall. Kinds: Primary, Secondary, Accent, Danger, Quiet, Icon, Chip (see `client/src/styles/pixel-buttons.css`).

Use one primary per screen. The consumer supplies the label (a short verb). Reading status uses a connected group: selected = primary, others = outline. Disabled uses `disabled` fill with `surface` text.

Button text is Arial bold.
