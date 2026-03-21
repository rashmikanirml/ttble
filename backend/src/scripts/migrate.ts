import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "../config/db.js";

function splitSqlStatements(sql: string): string[] {
  const withoutLineComments = sql
    .split(/\r?\n/g)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return withoutLineComments
    .split(/;\s*(?:\r?\n|$)/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

async function main() {
  const schemaPath = path.resolve(process.cwd(), "../database/schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  const statements = splitSqlStatements(sql);

  for (const statement of statements) {
    await db.query(statement);
  }

  console.log(`Schema migration complete. Executed ${statements.length} statements.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.end();
  });
