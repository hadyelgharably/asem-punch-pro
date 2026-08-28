import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASEM MMA 🥊 — Coach Asem Client Platform" },
      {
        name: "description",
        content:
          "Train, track, renew. ASEM MMA is the client platform for Coach Asem: packages, attendance and remaining sessions in one place.",
      },
      { property: "og:title", content: "ASEM MMA 🥊 — Coach Asem Client Platform" },
      {
        property: "og:description",
        content: "Packages, attendance and remaining sessions for every ASEM MMA fighter.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !session) return;
    if (role === "admin") void navigate({ to: "/dashboard", replace: true });
    else if (role === "client") void navigate({ to: "/home", replace: true });
  }, [loading, session, role, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden px-6 py-12">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="label-caps">Coach Asem · Mixed Martial Arts</p>
        <h1 className="display mt-4 text-6xl leading-[0.9] sm:text-8xl">
          ASEM
          <br />
          <span className="text-primary">MMA</span> 🥊
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          The training floor, digitised. Track packages, sessions and renewals — for the coach and
          every fighter.
        </p>
      </div>

      <div className="relative mt-12 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Fast", "Mark present in one tap"],
            ["Honest", "Lifetime session history"],
            ["Clear", "Remaining sessions front and centre"],
            ["Private", "Fighters see only their own data"],
          ].map(([k, v]) => (
            <div key={k} className="surface p-4">
              <p className="display text-xl text-primary">{k}</p>
              <p className="mt-1 text-sm text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
        <Link
          to="/auth"
          className="display flex w-full items-center justify-center rounded-xl bg-primary py-5 text-2xl text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
