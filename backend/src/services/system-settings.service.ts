import { db } from "../config/db.js";

export type SystemSetting = {
  key: string;
  value: unknown;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

function mapSetting(row: any): SystemSetting {
  return {
    key: row.key,
    value: row.value_json,
    description: row.description,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export class SystemSettingsService {
  async list(): Promise<SystemSetting[]> {
    const result = await db.query(
      `select key, value_json, description, updated_by, updated_at
       from system_settings
       order by key`,
    );
    return result.rows.map(mapSetting);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const result = await db.query(`select value_json from system_settings where key = $1`, [key]);
    if (!result.rowCount) {
      return undefined;
    }
    return result.rows[0].value_json as T;
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    const value = await this.get<unknown>(key);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }

  async upsert(input: { key: string; value: unknown; description?: string }, updatedBy: string): Promise<SystemSetting> {
    const result = await db.query(
      `insert into system_settings (key, value_json, description, updated_by, updated_at)
       values ($1, $2::jsonb, $3, $4, now())
       on conflict (key)
       do update set
         value_json = excluded.value_json,
         description = excluded.description,
         updated_by = excluded.updated_by,
         updated_at = now()
       returning key, value_json, description, updated_by, updated_at`,
      [input.key, JSON.stringify(input.value), input.description ?? null, updatedBy],
    );

    return mapSetting(result.rows[0]);
  }
}