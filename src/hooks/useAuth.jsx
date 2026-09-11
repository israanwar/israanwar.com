import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../lib/localStore";
import { supabase, supabaseEnabled } from "../lib/supabaseClient";

const AuthContext = createContext(null);

async function toAppSession(supabaseSession) {
  if (!supabaseSession?.user || !supabase) return null;
  const user = supabaseSession.user;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;

  return {
    provider: "supabase",
    access_token: supabaseSession.access_token,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile ?? {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? "",
      role: null,
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => supabaseEnabled ? null : auth.getSession());
  const [loading, setLoading] = useState(() => supabaseEnabled);

  useEffect(() => {
    if (supabaseEnabled && supabase) {
      let alive = true;
      setLoading(true);
      supabase.auth.getSession().then(async ({ data }) => {
        const nextSession = await toAppSession(data.session);
        if (alive) setSession(nextSession);
      }).catch(() => {
        if (alive) setSession(null);
      }).finally(() => {
        if (alive) setLoading(false);
      });

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
        const appSession = await toAppSession(next);
        if (alive) setSession(appSession);
      });
      return () => {
        alive = false;
        sub.subscription.unsubscribe();
      };
    }

    const off = auth.onChange(setSession);
    return off;
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      if (supabaseEnabled && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error("Supabase did not return a session.");
        const appSession = await toAppSession(data.session);
        setSession(appSession);
        return appSession;
      }
      return await auth.signIn(email, password);
    }
    finally { setLoading(false); }
  }, []);

  const signup = useCallback(async (email, password, fullName) => {
    setLoading(true);
    try {
      if (supabaseEnabled && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName ?? "" } },
        });
        if (error) throw error;
        const appSession = await toAppSession(data.session);
        if (appSession) setSession(appSession);
        return appSession;
      }
      return await auth.signUp(email, password, fullName);
    }
    finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    if (supabaseEnabled && supabase) await supabase.auth.signOut();
    await auth.signOut();
    setSession(null);
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile: session?.profile ?? null,
    role: session?.profile?.role ?? null,
    isAdmin: session?.profile?.role === "admin",
    isStaff: session?.profile?.role === "admin" || session?.profile?.role === "editor",
    loading,
    login, signup, logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
