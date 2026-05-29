import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  full_name: string;
  hospital: string;
  phone: string;
  work_hours: string;
  hospital_phone: string;
  hospital_address: string;
  specialty: string;
  avatar_url: string;
};

type Ctx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isPatient: boolean;
  isDoctor: boolean;
  role: "admin" | "doctor" | "patient" | null;
  isPro: boolean;
  proExpiresAt: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPatient, setIsPatient] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [role, setRole] = useState<"admin" | "doctor" | "patient" | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name,hospital,phone,work_hours,hospital_phone,hospital_address,specialty,avatar_url")
      .eq("user_id", uid)
      .maybeSingle();
    setProfile(
      data ?? {
        full_name: "",
        hospital: "",
        phone: "",
        work_hours: "",
        hospital_phone: "",
        hospital_address: "",
        specialty: "",
        avatar_url: "",
      },
    );
  };

  const loadStatus = async (uid: string, metadata: User["user_metadata"] = {}) => {
    const [{ data: fetchedRoles }, { data: subs }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase
        .from("subscriptions")
        .select("expires_at,is_active")
        .eq("user_id", uid)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1),
    ]);
    let roles = fetchedRoles ?? [];

    if (!roles.length && metadata?.role === "patient") {
      await supabase.rpc("ensure_patient_account", {
        _full_name: metadata.full_name ?? "",
        _phone: metadata.phone ?? "",
        _gender: metadata.gender ?? "",
        _language: metadata.language ?? "uz",
        _date_of_birth: metadata.date_of_birth || undefined,
      });
      const { data: recoveredRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      roles = recoveredRoles ?? roles;
    }

    setIsAdmin((roles ?? []).some((r: any) => r.role === "admin"));
    const rs = (roles ?? []).map((r: any) => r.role as string);
    const admin = rs.includes("admin");
    const patient = rs.includes("patient");
    const doctor = rs.includes("doctor");
    setIsPatient(patient);
    setIsDoctor(doctor);
    setRole(admin ? "admin" : patient ? "patient" : doctor ? "doctor" : null);
    const sub = subs?.[0];
    setIsPro(!!sub);
    setProExpiresAt(sub?.expires_at ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setLoading(true);
        setTimeout(() => {
          Promise.all([loadProfile(s.user.id), loadStatus(s.user.id, s.user.user_metadata)]).finally(() =>
            setLoading(false),
          );
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsPatient(false);
        setIsDoctor(false);
        setRole(null);
        setIsPro(false);
        setProExpiresAt(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user)
        Promise.all([loadProfile(s.user.id), loadStatus(s.user.id, s.user.user_metadata)]).finally(() =>
          setLoading(false),
        );
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const refreshStatus = async () => {
    const currentUser = user ?? (await supabase.auth.getUser()).data.user;
    if (currentUser) await loadStatus(currentUser.id, currentUser.user_metadata);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        isPatient,
        isDoctor,
        role,
        isPro,
        proExpiresAt,
        loading,
        refreshProfile,
        refreshStatus,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
