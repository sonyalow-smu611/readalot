# BookCover
2:3 cover with a 6px radius, 88px wide by default. When no image exists it shows the title centred on `placeholder`.

Pair with a one-line truncated title below at 13px. Never stretch; always `object-fit: cover`.

The title on the cover face is rotated 90° anticlockwise (reads bottom to top, like a spine), centred in the cover with ellipsis if it overflows. The caption below the cover stays horizontal. In CSS: `writing-mode: vertical-rl; transform: rotate(180deg)`.
