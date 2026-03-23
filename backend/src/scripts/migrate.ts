import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "../config/db.js";

async function main() {
  const schemaPath = path.resolve(process.cwd(), "../database/schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  await db.query(sql);
  console.log("Schema migration complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.end();
  });
