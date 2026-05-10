import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  // Server-side: prefer the internal HTTP URL so requests reach Traefik's
  // HTTP entrypoint directly (via the extra_hosts mapping to Traefik on
  // traefik-public). The websecure entrypoint has no router for
  // api.commons-hub.at and serves a self-signed cert, which fails with
  // DEPTH_ZERO_SELF_SIGNED_CERT. Fallback to the public HTTPS URL.
  const supabaseUrl =
    process.env.SUPABASE_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return createServerClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
