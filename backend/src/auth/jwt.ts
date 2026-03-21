import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ttble-dev-secret";

type TokenPayload = {
  userId: string;
  role: string;
  email: string;
};

export function signAuthToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyAuthToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as TokenPayload;
}
