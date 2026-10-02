import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ApiError,
  clearSession,
  fetchCurrentAdmin,
  getStoredAdmin,
  getToken,
  type AdminUser,
} from "@/lib/admin-api";

export type AdminAuthStatus = "checking" | "signed_in" | "signed_out";

export function useAdminAuth() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AdminAuthStatus>("checking");
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      setStatus("signed_out");
      return;
    }

    // Show the cached identity immediately, then confirm it against the API.
    setAdmin(getStoredAdmin());

    fetchCurrentAdmin()
      .then((current) => {
        if (cancelled) return;
        setAdmin(current);
        setStatus("signed_in");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Only an outright rejection means the session is gone. A rate limit,
        // network blip or server error must not sign the editor out.
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setStatus("signed_out");
          return;
        }
        setStatus("signed_in");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "signed_out") {
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [status, navigate]);

  const signOut = useCallback(() => {
    clearSession();
    setAdmin(null);
    setStatus("signed_out");
  }, []);

  return { status, admin, signOut };
}
