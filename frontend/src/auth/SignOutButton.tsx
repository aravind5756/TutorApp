import { useState } from "react";
import { LogOut } from "lucide-react";

import { useAuth } from "./useAuth";

export function SignOutButton() {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await logout();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" disabled={busy} onClick={handleLogout}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60">
        <LogOut size={16} aria-hidden="true" />
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && <p role="alert" className="px-3 text-sm">{error}</p>}
    </div>
  );
}
