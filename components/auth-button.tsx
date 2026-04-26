import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  console.log('AuthButton rendering started');
  try {
    const supabase = await createClient();
    console.log('Supabase client created in AuthButton');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    console.log('Auth user data:', user ? 'User found' : 'No user found');

    return user ? (
      <div className="flex items-center gap-4">
        Hey, {user.email}!
        <LogoutButton />
      </div>
    ) : (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  } catch (error) {
    console.error('Error in AuthButton:', error);
    return (
      <div className="text-red-500">Auth error</div>
    );
  }
}
