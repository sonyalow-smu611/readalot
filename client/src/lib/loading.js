// Scaffolded with AI assistance — see AI_USAGE.md
// How long a button that waited on the server shows its tick once it's done
// (components/shared/LoadButton.vue). Something that goes away when it's done (a friend request
// once it's answered) waits this long first, so the tick is seen.
export const DONE_FOR = 1200

export const waitForTick = () => new Promise((resolve) => setTimeout(resolve, DONE_FOR))
