import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

/** Throws unless the current session is an admin. Use in server actions. */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}
