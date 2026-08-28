import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ASEM MMA 🥊" },
      {
        name: "description",
        content: "Sign in to ASEM MMA to view your training package, sessions and renewals.",
      },
      { property: "og:title", content: "Sign in — ASEM MMA 🥊" },
      { property: "og:description", content: "Access your ASEM MMA training dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !session) return;
    if (role === "admin") void navigate({ to: "/dashboard", replace: true });
    else if (role === "client") void navigate({ to: "/home", replace: true });
  }, [loading, session, role, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() || email.trim() },
          },
        });
        if (signUpError) throw signUpError;
        setMessage("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Try email and password.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="text-3xl">🥊</span>
          <h1 className="display mt-2 text-4xl">
            ASEM <span className="text-primary">MMA</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your training account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={submit} className="surface mt-6 space-y-4 p-5">
          {mode === "signup" ? (
            <div>
              <label className="label-caps" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-elevated px-4 py-3 text-base outline-none focus:border-primary"
                autoComplete="name"
              />
            </div>
          ) : null}
          <div>
            <label className="label-caps" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-elevated px-4 py-3 text-base outline-none focus:border-primary"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label-caps" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-elevated px-4 py-3 text-base outline-none focus:border-primary"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {error ? <p className="text-sm text-primary">{error}</p> : null}
          {message ? <p className="text-sm text-success">{message}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="display w-full rounded-xl bg-primary py-4 text-xl text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => void google()}
            className="w-full rounded-xl border border-border py-3 text-sm font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-primary"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
