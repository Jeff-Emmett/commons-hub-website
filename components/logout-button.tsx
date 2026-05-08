"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookies are cleared server-side regardless; ignore network error.
    }
    router.push("/");
    router.refresh();
  };

  return (
    <Button onClick={logout} disabled={busy}>
      {busy ? "..." : "Logout"}
    </Button>
  );
}
