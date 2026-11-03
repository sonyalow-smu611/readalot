// Scaffolded with AI assistance — see AI_USAGE.md
// Assert-style check for the demo registration (routes/demoAuth.js): only demo-domain emails get
// through, bad input is turned away, and (with Supabase keys) a demo account can be made once.
import assert from "node:assert";
import { app } from "../src/app.js";
import { env } from "../src/services/env.js";
import { supabase } from "../src/services/supabase.js";
import { isDemoEmail } from "../src/routes/demoAuth.js";

assert.ok(env.DEMO_CODE_DOMAINS.length > 0, "a demo domain is set by default");
const domain = env.DEMO_CODE_DOMAINS[0];
assert.ok(isDemoEmail(`someone@${domain}`), "demo domain is a demo email");
assert.ok(isDemoEmail(`Someone@${domain.toUpperCase()}`), "the domain is not case sensitive");
assert.ok(!isDemoEmail("someone@gmail.com"), "other domains are not");
assert.ok(!isDemoEmail(`${domain}@gmail.com`), "the domain must be after the @");
assert.ok(!isDemoEmail(""), "empty is not");
assert.ok(!isDemoEmail(`a@${domain}@gmail.com`), "only what follows the last @ counts");
assert.ok(!isDemoEmail(`@${domain}`), "an empty name is not");
assert.ok(!isDemoEmail(`a@sub.${domain}`), "a subdomain is not");

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/demo-auth/register`;
const post = (body) =>
  fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

let created = null;
try {
  assert.equal((await post({ email: "x@gmail.com", password: "abcdef", username: "abc.def" })).status, 403, "a real email is turned away");
  assert.equal((await post({ email: `a@${domain}@gmail.com`, password: "abcdef", username: "abc.def" })).status, 403, "a smuggled domain is turned away");
  assert.equal((await post({ email: "not-an-email", password: "abcdef", username: "abc.def" })).status, 403, "an invalid email is turned away");
  assert.equal((await post({})).status, 403, "an empty body is turned away");
  assert.equal((await post({ email: `x@${domain}`, username: "abc.def" })).status, 400, "a missing password is turned away");
  assert.equal((await post({ email: `x@${domain}`, password: "abc", username: "abc.def" })).status, 400, "a short password is turned away");
  assert.equal((await post({ email: `x@${domain}`, password: "abcdef", username: "A B" })).status, 400, "a bad username is turned away");

  if (env.HAS_SUPABASE) {
    const email = `check.${Date.now()}@${domain}`;
    const body = { email, password: "abcdef", username: `check.${String(Date.now()).slice(-8)}` };
    assert.equal((await post(body)).status, 201, "a demo account is made");
    const list = await supabase.auth.admin.listUsers({ perPage: 200 });
    created = list.data.users.find((user) => user.email === email);
    assert.ok(created?.email_confirmed_at, "the account is already confirmed");
    assert.equal((await post(body)).status, 409, "the same email is not made twice");
  } else {
    assert.equal((await post({ email: `x@${domain}`, password: "abcdef", username: "abc.def" })).status, 503, "no Supabase, no sign-up");
  }
} finally {
  if (created) {
    await supabase.from("profiles").delete().eq("id", created.id);
    await supabase.auth.admin.deleteUser(created.id);
  }
  server.close();
}
console.log("demoAuth checks passed");
