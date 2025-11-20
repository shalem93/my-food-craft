import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export type AppRole = "chef" | "customer";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  userRoles: AppRole[];
  signIn: (email: string, password: string, preferredRole?: AppRole) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    role: AppRole
  ) => Promise<{ error: string | null; emailSent?: boolean }>;
  signOut: () => Promise<void>;
  switchRole: (role: AppRole) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    // 1) Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Defer any Supabase calls to prevent deadlocks
      if (newSession?.user) {
        setTimeout(() => {
          ensureUserRole(newSession);
          fetchUserRole(newSession.user.id);
        }, 0);
      } else {
        setUserRole(null);
        setUserRoles([]);
        localStorage.removeItem("activeRole");
      }
    });

    // 2) Then get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          ensureUserRole(session);
          fetchUserRole(session.user.id);
        }, 0);
      }
    }).finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string, preferredRole?: AppRole) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && data && data.length > 0) {
        const roles = data.map(r => r.role as AppRole);
        setUserRoles(roles);
        
        // Set active role: preferred > stored > chef > first available
        const storedRole = localStorage.getItem("activeRole") as AppRole | null;
        const activeRole = preferredRole || 
                          (storedRole && roles.includes(storedRole) ? storedRole : null) ||
                          (roles.includes("chef") ? "chef" : roles[0]);
        
        setUserRole(activeRole);
        localStorage.setItem("activeRole", activeRole);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const ensureUserRole = async (currentSession: Session) => {
    try {
      const uid = currentSession.user.id;
      // Check if the user already has a role
      const { data: roles, error: readErr } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);

      if (readErr) return; // Silently ignore

      if (roles && roles.length > 0) return; // Already has a role

      // Try to use role from user metadata, otherwise default to customer
      const metaRole = (currentSession.user.user_metadata?.selected_role as AppRole | undefined) ?? "customer";

      const { error: insertErr } = await (supabase as any)
        .from("user_roles")
        .insert({ user_id: uid, role: metaRole });

      if (insertErr) {
        // Ignore duplicates or RLS issues silently for now
        return;
      }
    } catch {
      // no-op
    }
  };

  const signIn: AuthContextType["signIn"] = async (email, password, preferredRole) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
    
    if (data.user && preferredRole) {
      localStorage.setItem("activeRole", preferredRole);
      await fetchUserRole(data.user.id, preferredRole);
    }
    
    toast({ title: "Welcome back", description: "You are now signed in." });
    return { error: null };
  };

  const signUp: AuthContextType["signUp"] = async (email, password, role) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { selected_role: role },
      },
    });

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return { error: error.message };
    }

    const emailSent = !data.session; // if confirmation is required
    if (emailSent) {
      toast({ title: "Check your email", description: "Confirm your email to finish signing up." });
    } else {
      toast({ title: "Welcome", description: "Your account has been created." });
    }
    return { error: null, emailSent };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("activeRole");
    toast({ title: "Signed out", description: "You have been signed out." });
  };

  const switchRole = (role: AppRole) => {
    if (userRoles.includes(role)) {
      setUserRole(role);
      localStorage.setItem("activeRole", role);
      toast({ title: "Role switched", description: `Now using ${role} account` });
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, session, loading, userRole, userRoles, signIn, signUp, signOut, switchRole }), 
    [user, session, loading, userRole, userRoles]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
