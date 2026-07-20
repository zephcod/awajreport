"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCompanyByPin } from "@/lib/data";
import { createToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function loginWithPin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const pin = String(formData.get("pin") ?? "").trim();
  if (!/^\d{4,10}$/.test(pin)) {
    return { error: "Enter your PIN (4–10 digits)." };
  }

  let dest: string;
  let token: string;

  if (process.env.ADMIN_PIN && pin === process.env.ADMIN_PIN) {
    token = await createToken("*", "admin");
    dest = "/admin";
  } else {
    const company = await getCompanyByPin(pin);
    if (!company) {
      // Small delay to slow brute-force attempts.
      await new Promise((r) => setTimeout(r, 750));
      return { error: "That PIN doesn't match an active report. Check with your Awaj ET contact." };
    }
    token = await createToken(company.$id, "client");
    dest = `/r/${company.$id}`;
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  redirect(dest);
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
