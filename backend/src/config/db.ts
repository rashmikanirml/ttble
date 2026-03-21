import { Pool } from "pg";
import { assertDatabaseConfig, databaseConfig } from "./database.js";

assertDatabaseConfig();

export const db = new Pool({
  connectionString: databaseConfig.url,
  ssl: {
    rejectUnauthorized: false,
  },
});
