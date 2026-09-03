import { useState, type FormEvent } from "react";
import { ArrowRight, GraduationCap, LoaderCircle, LockKeyhole } from "lucide-react";

import { ApiError } from "../api/client";
import { useAuth } from "./useAuth";

export function LoginPage() {
  const { login, error: sessionError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 400
        ? "The email or password is incorrect. Please try again."
        : "Unable to sign in. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f3ee] text-[#172825] lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-[#142b2b] p-8 text-white sm:p-12 lg:p-16">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#f4c85b] text-[#142b2b]">
            <GraduationCap size={25} aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">TutorDesk</span>
        </div>
        <div className="my-10 max-w-md lg:my-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9fc5bb]">Your tutoring practice, together</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">More time for teaching.<br /><span className="text-[#f4c85b]">A place for everything else.</span></h2>
          <p className="mt-6 leading-7 text-[#bdd0cd]">Lessons, learning and the little things in between. Welcome to your private tutoring workspace.</p>
        </div>
        <p className="flex items-center gap-2 text-xs text-[#bdd0cd]"><LockKeyhole size={14} aria-hidden="true" /> Access for invited accounts only</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <p className="mb-2 text-sm font-semibold text-[#1f765f]">Welcome back</p>
          <h1 className="text-3xl font-bold tracking-tight">Sign in to TutorDesk</h1>
          <p className="mt-3 text-sm leading-6 text-[#66736f]">Use the email and password for your account.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5" aria-busy={submitting}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email address</label>
              <input id="email" name="email" type="email" required autoComplete="username"
                value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting}
                className="w-full rounded-xl border border-[#cbd2c9] bg-white px-4 py-3 outline-offset-2 focus:outline-2 focus:outline-[#1f765f] disabled:opacity-60" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password"
                value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting}
                className="w-full rounded-xl border border-[#cbd2c9] bg-white px-4 py-3 outline-offset-2 focus:outline-2 focus:outline-[#1f765f] disabled:opacity-60" />
            </div>
            {(message || sessionError) && <p role="alert" className="rounded-xl border border-[#e7b8a8] bg-[#fff1eb] p-3 text-sm text-[#8a3e2b]">{message || sessionError}</p>}
            <button type="submit" disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f765f] px-4 py-3 font-semibold text-white hover:bg-[#185f4d] disabled:cursor-wait disabled:opacity-70">
              {submitting ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-xs leading-5 text-[#66736f]">Need access or help with your account? Contact your tutor or the workspace administrator.</p>
        </div>
      </section>
    </main>
  );
}
