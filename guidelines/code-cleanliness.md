# Code Cleanliness

Write code a teammate can read in one pass. Prefer clarity over cleverness.

## Structure

- Keep HTML, CSS, and JS/Vue responsibilities separate
- One component / module / route file does one job
- Name files and functions after what they do (`getNearbyClinics`, not `doStuff`)
- Avoid deep nesting; extract helpers instead of 4-level callbacks or `if` pyramids
- Do not leave commented-out code, unused imports, or `console.log` in finished work

## JavaScript / Vue

- Use `const` / `let`, not `var`
- Prefer `async` / `await` over `.then()` chains
- Handle fetch errors and empty states; never swallow errors
- Keep Vue templates simple: no heavy logic in the template
- Put reusable UI in small Vue components; put API calls in a small `services/` or `api/` module

```javascript
// BAD
fetch(url).then(r => r.json()).then(d => { this.x = d }).catch(() => {})

// GOOD
async function loadClinics() {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not load clinics", error);
    throw error;
  }
}
```

## CSS / Bootstrap

- Use Bootstrap utilities and components before writing custom CSS
- Custom CSS only for what Bootstrap cannot do
- Mobile-first. Check layout from a narrow phone width up to desktop
- No 3D transforms used as interaction (rotate/orbit/perspective worlds)

## Comments and docs

- Comment *why*, not *what*, and only when the reason is not obvious
- Credit third-party or AI-generated boilerplate in comments and `README.txt`
- Keep functions short. If a function needs a paragraph of comments, split it
