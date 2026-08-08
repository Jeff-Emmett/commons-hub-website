---
trigger: always_on
---

<coding>
1. API fetches are done via functions in files in @lib/actions
2. authentication and authorization is done via Directus — see app/api/auth/login
   and app/api/admin/*. Supabase is retired; do not reintroduce it.
3. role based access controll is implemented in Directus and roles are carried on
   the Directus session.
4. use the ProtectedRoute component for any admin pages, and pages for specific roles.
5. use @lib/database.types.ts for types. That file is NO LONGER generated — the
   Supabase project it came from is gone — so edit it by hand when the schema moves.
6. don't make changes to the db except if i specifcally ask for it.
7. inspect the data structure in the Directus admin at https://admin.commons-hub.at.
   There is no supabase mcp integration any more.
</coding>

<style>
1. we use a mobile first approach.
2. styles for different screen sizes are defined in global.css
</style>

