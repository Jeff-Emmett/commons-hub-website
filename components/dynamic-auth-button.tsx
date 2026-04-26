'use client'

import Link from "next/link";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { useAuth } from "@/lib/auth/AuthContext";

export function DynamicAuthButton() {
  const { user, loading } = useAuth();
  
  // Show a simple loading state while auth state is being determined
  if (loading) {
    return <div className="text-sm opacity-70">Loading...</div>;
  }
  
  // User is logged in
  if (user) {
    return (
      <div className="flex items-center gap-4">
        Hey, {user.email}!
        <LogoutButton />
      </div>
    );
  }
  
  // User is not logged in
  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
