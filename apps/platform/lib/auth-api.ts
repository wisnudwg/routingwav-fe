import type { Session } from "./auth"

export type SignInResult = { ok: true; session: Session } | { ok: false; message: string }

// TODO: replace both with real API calls. The server should verify credentials,
// set an httpOnly session cookie, and return generic errors only.

export async function signInRoot(email: string, password: string): Promise<SignInResult> {
  void password
  return { ok: true, session: { type: "root", email: email.trim().toLowerCase() } }
}

export async function signInIam(
  account: string,
  username: string,
  password: string
): Promise<SignInResult> {
  void password
  return {
    ok: true,
    session: { type: "iam", account: account.trim().toLowerCase(), username: username.trim() },
  }
}