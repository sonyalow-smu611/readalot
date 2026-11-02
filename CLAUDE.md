@AGENTS.md

## Branches: one per teammate

- Each teammate has one branch, and every feature they build goes on it. Never create a new
  branch for a new feature, and never use a separate worktree branch for one.
- Before starting work, find out whose branch it is and switch to it. Bring `main` in first
  (`git fetch origin` then `git merge origin/main`) so the work starts from the latest code.
- Before a pull request, merge `origin/main` into the branch again and fix any conflicts there.
  Pull requests always go from the teammate's branch into `main`.
