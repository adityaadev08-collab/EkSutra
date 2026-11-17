// =============================================================================
// app/actions/auth.ts — Server Actions for Cookie Authentication
// =============================================================================
// WHY HERE: 
//   Server Actions ("use server") allow the client React tree to read/set
//   HTTP-only session cookies without exposing them to browser JavaScript.
// =============================================================================

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MOCK_USERS, UserProfile } from "@/lib/data";

/**
 * Sets the active session cookie for a given mock username ('ravi' or 'meena')
 * without triggering a hard page redirect.
 */
export async function setSessionUser(username: string): Promise<{
  success: boolean;
  user?: UserProfile;
  error?: string;
}> {
  const normalizedKey = username.toLowerCase().trim();
  const user = MOCK_USERS[normalizedKey];

  if (!user) {
    return {
      success: false,
      error: "User not found. Try 'ravi' or 'meena'.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set("eksutra_session", normalizedKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return {
    success: true,
    user,
  };
}

/**
 * Clears the session cookie in-place without a redirect.
 */
export async function clearSession(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete("eksutra_session");
  return { success: true };
}

/**
 * Legacy login action for HTML forms.
 */
export async function login(formData: FormData): Promise<void> {
  const username = formData.get("username") as string;
  const result = await setSessionUser(username);

  if (!result.success) {
    redirect("/?login=error");
  }

  redirect("/");
}

/**
 * Legacy logout action for forms.
 */
export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}
