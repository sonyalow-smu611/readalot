// Scaffolded with AI assistance — see AI_USAGE.md
// A throwaway Postgres in Docker for the database/ checks, with what Supabase has that plain
// Postgres doesn't: auth.uid() and the API's two roles. Needs Docker running.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DATABASE = fileURLToPath(new URL("../../database", import.meta.url));

function docker(...args) {
  return execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

// Starts one, runs `check({ sql, runFile })` against it, and always stops it.
// sql(query): the rows, a line each, columns split by |. runFile(name): a file from database/.
// Both take the database to use last; postgres unless said.
export function withPostgres(name, check) {
  const container = `readalot-${name}-check-${process.pid}`;
  const psql = (database, ...args) =>
    docker("exec", container, "psql", "-h", "127.0.0.1", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", ...args);
  const sql = (query, database = "postgres") => psql(database, "-At", "-c", query);
  const runFile = (file, database = "postgres") => psql(database, "-q", "-f", `/sql/${file}`);

  docker("run", "-d", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=check", "-v", `${DATABASE}:/sql:ro`, "postgres:16");
  try {
    // ready once it answers over TCP: the first-boot server only listens on its socket, then restarts
    for (let tries = 0; ; tries += 1) {
      try {
        sql("select 1");
        break;
      } catch (error) {
        if (tries > 60) throw error;
        execFileSync("sleep", ["0.5"]);
      }
    }
    sql(`create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create role anon;
      create role authenticated;
      grant usage on schema public, auth to anon, authenticated`);
    check({ sql, runFile });
  } finally {
    docker("stop", container);
  }
}
