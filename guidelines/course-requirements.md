# IS216 Course Guardrails

Build a dynamic, interactive 2D web app that solves a real problem. Integrate the course stack; do not add complexity for its own sake.

## Must have

- A clear problem, audience, and user journey
- HTML, CSS, JavaScript, and a working Vue UI
- Responsive layout (Chrome DevTools, iPhone 6 through Bootstrap XL)
- Backend datastore with create/read (and update/delete if the feature needs it)
- Meaningful use of at least one public API over async HTTP
- E2E tests for every core feature, with run instructions in the README
- GitHub used for real collaboration (not a last-day dump)
- A live cloud deploy the graders can open

Start from “what problem are we solving?”, not “what portal can we build?”

## Must not

- 3D rendering, 3D scenes, or 3D interaction
- Core features that only work in a recorded video (Week 13 demo must be live)
- Dummy data when a public dataset or API exists, unless the teaching team agreed
- APIs whose free tier cannot survive ~5–6 grader hits per feature per day
- AI pushing code to GitHub or any remote repo

## AI / LLM

Allowed: search, layout/theme ideas, explaining errors, boilerplate, mock data, test-case drafts.

Not allowed: main business logic, backend endpoints, or critical frontend interactivity written by AI. Students must solve those themselves.

If AI produced a snippet, say so in `README.txt` and in a short code comment.

## Git and the remote repo

AI must **never** push to the remote on its own. No `git push`, force-push, or other publish-to-remote command from an AI tool.

A teammate reviews the local work and **manually pushes** to the repo when the group is ready.
