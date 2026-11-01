// Scaffolded with AI assistance — see AI_USAGE.md
// Friend requests and friends; the rules are in services/friends.js.
import { Router } from "express";
import { requireSignedIn } from "../middleware/auth.js";
import { answerRequest, friendsOf, removeFriend, requestFriend } from "../services/friends.js";

const router = Router();

router.use(requireSignedIn);

router.get("/", async (req, res, next) => {
  try {
    res.json(await friendsOf(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.post("/requests", async (req, res, next) => {
  try {
    if (!(await requestFriend(req.user.id, String(req.body?.readerId ?? "")))) {
      return res.status(404).json({ error: "Reader not found" });
    }
    res.status(201).json({ requested: true });
  } catch (err) {
    next(err);
  }
});

for (const [answer, accept] of [["accept", true], ["decline", false]]) {
  router.post(`/requests/:id/${answer}`, async (req, res, next) => {
    try {
      if (!(await answerRequest(req.user.id, req.params.id, accept))) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json({ accepted: accept });
    } catch (err) {
      next(err);
    }
  });
}

router.delete("/:id", async (req, res, next) => {
  try {
    if (!(await removeFriend(req.user.id, req.params.id))) {
      return res.status(404).json({ error: "Friend not found" });
    }
    res.json({ removed: true });
  } catch (err) {
    next(err);
  }
});

export default router;
