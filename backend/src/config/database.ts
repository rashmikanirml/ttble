import "dotenv/config";

export type DatabaseConfig = {
  url: string;
};

export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL || "",
};

export function assertDatabaseConfig(): void {
  if (!databaseConfig.url) {
    throw new Error("DATABASE_URL is missing. Set it in the project .env file.");
  }
}
