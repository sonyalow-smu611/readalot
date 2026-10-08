import { app } from "./app.js";
import { env } from "./services/env.js";

app.listen(env.PORT, () => {
  console.log(`Readalot API listening on http://localhost:${env.PORT}`);
});
