---
trigger: always_on
---

<coding>
1. API fetches are done via functions in files in @lib/actions
2. authentication and authorization is done via supabase authentication.
3. role based access controll is implemented in supabase and user_roles are enscribed into the JWT.
4. use the ProtectedRoute component for any admin pages, and pages for specific roles.
5. use @lib\database.types.ts for types. Ask me to renew the file via supabase dashboard if types are missing.
6. don't make changes to the db except if i specifcally ask for it.
7. query the db via supabase mcp integration to understand the data structure.
</coding>

<style>
1. we use a mobile first approach.
2. styles for different screen sizes are defined in global.css
</style>

