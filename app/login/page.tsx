"use client";

import { useActionState } from "react";
import { loginWithPin, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginWithPin, initial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-bold tracking-tight text-white">
            Awaj <span className="text-gold">ET</span>
          </p>
          <p className="mt-2 text-sm text-white/60">Campaign Reports</p>
        </div>

        <form
          action={action}
          className="rounded-2xl border border-white/10 bg-navy-soft p-6 shadow-xl"
        >
          <label
            htmlFor="pin"
            className="mb-2 block text-sm font-medium text-white/80"
          >
            Enter your PIN
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={10}
            placeholder="••••••"
            className="w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-white placeholder:text-white/25 focus:border-gold focus:outline-none"
          />
          {state.error && (
            <p className="mt-3 text-sm text-red-400">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-lg bg-gold px-4 py-3 font-medium text-navy transition hover:bg-amber disabled:opacity-60"
          >
            {pending ? "Checking…" : "View my report"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          Your PIN was shared by your Awaj ET account manager.
        </p>
      </div>
    </main>
  );
}
