# Project Guardrails

Rules for building the IS216 app so it stays course-compliant, demo-safe, and easy for every teammate to read.

Detail files live in [`guidelines/`](guidelines/):

- [Allowed and disallowed tech stack](guidelines/tech-stack.md)
- [Code cleanliness](guidelines/code-cleanliness.md)
- [Course requirements and AI policy](guidelines/course-requirements.md)

---

## Allowed tech stack

| Layer | Use this |
|-------|----------|
| Markup / style / script | HTML5, CSS3, JavaScript (ES6+) |
| UI framework | Vue.js 3 |
| CSS framework | Bootstrap 5 (plain CSS only when Bootstrap is not enough) |
| Backend | Express.js (Node.js). IS113 examples are fine to build on |
| Data | MongoDB, JSON files, or one other simple store |
| External data | At least one public API via `fetch` / async HTTP. Axios is fine |
| Tests | E2E coverage of all core user journeys |
| Version control | GitHub (real collaboration, not a last-day zip) |
| Hosting | One simple cloud host: Vercel, Firebase, Render, AWS, GCP, or Azure |
| Libraries | Free/public only. Credit them in comments and the presentation |

Chrome is the grading browser. Layout must work from iPhone 6 width to Bootstrap’s XL breakpoint.

---

## Disallowed tech stack

| Category | Do not use |
|----------|------------|
| **3D** | Three.js, Babylon.js, A-Frame, Cesium, React Three Fiber, WebGL/WebGPU scenes, 3D CSS worlds, VR/AR, orbit/rotate/perspective “experiences” |
| Frontend | React, Next.js, Angular, Svelte, Nuxt, TypeScript |
| Backend | NestJS, GraphQL, microservices, Docker, Kubernetes, serverless-only setups |
| Data | Paid APIs/libraries; scraping **instead of** a public API |
| Process | Copied GitHub apps presented as original work |

Scraping is only allowed if it follows the site’s `robots.txt`, is legal, and is credited — and it still does **not** replace the required public API.

If a tool is on neither list, pick the simplest option already in **Allowed**.

---

## Product and course rules

- Solve a real problem for a named audience. Do not start from “what portal can we build?”
- The site must be dynamic: the UI talks to a backend store.
- Use real public data when it exists. Ask the teaching team before relying on dummy data.
- Free-tier APIs must survive about 5–6 grader calls per feature per day.
- Week 13 is a **live** demo. Do not design features that only work in a video.

### AI / LLM

**Allowed:** search, layout/theme ideas, explaining errors, boilerplate, mock data, draft test cases.

**Not allowed:** AI writing main business logic, backend endpoints, or critical frontend interactivity.

Record any AI-only snippets in `README.txt` and in a short code comment.

### Git and the remote repo

AI must **never** push to the remote repo on its own (`git push`, force-push, or any equivalent).

A teammate reviews the local changes and **manually pushes** when the group is ready. Do not ask an AI tool to publish commits for you.

---

## Code cleanliness

- Prefer clarity over cleverness. A teammate should understand a file in one pass.
- One file / component / route, one job. Name things after what they do.
- `const` / `let` only. Prefer `async` / `await`. Handle errors and empty states.
- Keep Vue templates thin. Put API calls in `services/` or `api/`.
- Use Bootstrap first; write custom CSS only for gaps.
- No 3D transforms as interaction.
- No commented-out code, unused imports, or leftover `console.log` in finished work.
- Comment *why*, not *what*. Credit third-party and AI boilerplate.
