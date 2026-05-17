import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "../supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u?.email) {
        setUser({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name
        });
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (u?.email) {
        setUser({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, name: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) throw error;
    if (!data.user) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        name: name,
        phone: phone
      });

    if (profileError) throw profileError;
  };


  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const googleLogin = async () => {
    try {
      // Use Linking.createURL for a more robust redirect URI in both Expo Go and Standalone
      const redirectTo = Linking.createURL("auth-callback");

      console.log("Starting Google Login with redirect:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No login URL received from Supabase");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const { params, errorCode } = extractParamsFromUrl(result.url);

        if (errorCode) {
          throw new Error(`Authentication Error: ${errorCode}`);
        }

        // 1. Check for PKCE flow (Preferred/Default in Supabase v2)
        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError) throw exchangeError;
          console.log("Session established via PKCE code exchange");
        }
        // 2. Check for Implicit flow (Tokens in URL)
        else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
          console.log("Session established via tokens");
        } else {
          console.warn("Auth success but no tokens or code found in URL");
          alert("Login successful but app failed to catch the session. Please try restarting the app.");
        }
      }
    } catch (err: any) {
      console.error("Google Login Catch:", err);
      alert("Login Error: " + (err.message || "Failed to sign in with Google"));
    }
  };

  const extractParamsFromUrl = (url: string) => {
    const params: any = {};

    // Parse URL - handle standard query params and fragments
    // We replace # with ? to use URLSearchParams on the fragment too
    const urlObj = new URL(url.replace("#", "?"));
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const errorCode = params.error || params.error_description || null;

    return { params, errorCode };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: makeRedirectUri({ scheme: "wheelx" }),
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        googleLogin,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
