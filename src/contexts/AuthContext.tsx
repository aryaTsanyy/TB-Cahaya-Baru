import { createContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/SupabaseClient";

export type Role = "hunter" | "leader" | "admin";

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  total_points: number;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string): Promise<void> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, role, avatar_url, total_points")
      .eq("id", userId)
      .single<Profile>();
    if (error || !data) {
      setProfile(null);
      return;
    }
    setProfile(data);
  };

  const refreshProfile = async (): Promise<void> => {
    if (session?.user.id) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async (): Promise<void> => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.user.id) {
        await fetchProfile(data.session.user.id);
      }
      if (!cancelled) setIsLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user.id) {
        void fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
