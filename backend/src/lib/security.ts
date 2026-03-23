import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

function looksHashed(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, storedHashOrPlain: string): Promise<boolean> {
  if (looksHashed(storedHashOrPlain)) {
    return bcrypt.compare(password, storedHashOrPlain);
  }

  // Backward compatibility for legacy plain-text seeded users.
  return password === storedHashOrPlain;
}

export function shouldUpgradePasswordHash(storedHashOrPlain: string): boolean {
  return !looksHashed(storedHashOrPlain);
}