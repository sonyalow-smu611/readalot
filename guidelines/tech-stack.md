# Tech Stack Guardrails

Prefer the course-supported stack so the app stays simple, gradable in Chrome, and understandable by every teammate.

## Allowed

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Vue.js 3
- **Styling:** Bootstrap 5 (or plain CSS). Responsive from iPhone 6 width to Bootstrap XL
- **Backend:** Express.js (Node.js)
- **Data:** MongoDB, JSON files, or another simple datastore. Use real public data when available
- **APIs:** At least one external public API via `fetch` / async HTTP. Axios is fine
- **Auth / storage:** Session or token auth only if the problem needs it
- **Testing:** E2E tests for all core user journeys, plus a README section on how to run them
- **Tooling:** GitHub, free/public libraries (credit them in comments and the presentation)
- **Deploy:** One simple host (Vercel, Firebase, Render, AWS, GCP, or Azure)

Reuse IS113 Express examples if useful. Chrome is the grading browser.

## Disallowed

- **3D:** Three.js, Babylon.js, A-Frame, Cesium, React Three Fiber, WebGL/WebGPU scenes, 3D CSS worlds, VR/AR, or any 3D render/interaction
- **Heavy frontend:** React, Next.js, Angular, Svelte, Nuxt, TypeScript
- **Heavy backend:** NestJS, GraphQL, microservices, Docker, Kubernetes, serverless-only architectures
- **Paid** libraries or APIs that require a paid plan to grade the app
- **Scraping** as a substitute for a public API (scraping also needs `robots.txt` + legal compliance + credit)
- Presenting copied GitHub code as original work

## If a request conflicts

Use the allowed stack. Do not add 3D, extra frameworks, or “more impressive” tooling. If something is missing from both lists, pick the simplest option already in **Allowed**.
