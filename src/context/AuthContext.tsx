"use client";

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/auth";
import { ROLE_META } from "@/types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:           User    | null;
  profile:        Profile | null;
  role:           UserRole | null;
  loading:        boolean;
  signOut:        () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user:           null,
  profile:        null,
  role:           null,
  loading:        true,
  signOut:        async () => {},
  refreshProfile: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // ── Stable client ──────────────────────────────────────────────────────────
  // CRITICAL: createClient() must NOT be called on every render.
  // Calling it at the module level (outside the component) or here with
  // useState lazy-init creates exactly one instance for the lifetime of the
  // provider.  If it were called directly in the function body, React would
  // create a new Supabase instance every render → fetchProfile's useCallback
  // dep array would see a new reference → fetchProfile would be recreated →
  // the useEffect dep array would change → useEffect would re-run → setProfile
  // would trigger a new render → new supabase instance → infinite loop that
  // intermittently resets profile to null, making role snap back to "student".
  const [supabase] = useState(() => createClient());

  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Profile fetch ──────────────────────────────────────────────────────────
  // supabase is now stable so fetchProfile is stable too — no re-creation loop.
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("[AuthContext] fetchProfile error:", err);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // ── Auth listener — runs exactly once ──────────────────────────────────────
  // supabase and fetchProfile are both stable references so these deps never
  // change — the effect never re-runs after mount.
  useEffect(() => {
    // Hard ceiling: guarantee `loading` always resolves, even if getUser() or
    // fetchProfile() stalls indefinitely on a GoTrue navigator.locks wait (the
    // same lock-contention class that stalled the Public Content pages). Every
    // path that clears `loading` for a signed-in user runs *after* the profile
    // query resolves — so a hung query would otherwise leave the dashboard
    // avatar/name skeleton (Sidebar) spinning forever. This net flips `loading`
    // off regardless; the avatar then falls back to initials and upgrades to the
    // real value if the profile lands later. (The public Navbar carries its own
    // 2.5 s equivalent — this is the single source-of-truth version.)
    const safetyTimer = setTimeout(() => setLoading(false), 3000);

    // Get current session on mount
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // React to sign-in / sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]); // stable refs → runs once

  // ── Sign-out ───────────────────────────────────────────────────────────────
  // Wraps supabase.auth.signOut() in a 3-second timeout so a hanging API call
  // never prevents the user from logging out.  State is always cleared.
  const signOut = async () => {
    try {
      await Promise.race([
        // scope: "global" invalidates the JWT across every device, not just
        // this browser. Without it, copies of the access token elsewhere
        // would remain valid until expiry.
        supabase.auth.signOut({ scope: "global" }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("signOut timeout")), 3000)
        ),
      ]);
    } catch (err) {
      console.error("[AuthContext] signOut error:", err);
    }
    // Always clear regardless of whether the API call succeeded
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role:    profile?.role ?? null,  // null until profile loads, NEVER a fake default
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Returns the dashboard path for the current user's role. */
export function useDashboardPath(): string {
  const { role } = useAuth();
  if (!role) return "/dashboard";
  return ROLE_META.find(r => r.value === role)?.dashboardPath ?? "/dashboard";
}
