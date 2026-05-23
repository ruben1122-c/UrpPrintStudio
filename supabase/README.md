# Supabase setup

URP PrintStudio usa Supabase como infraestructura de Auth, base de datos y
Storage, pero la lógica sensible del MVP vive en el backend Node/Express dentro
de `backend/`.

El frontend no debe usar la service role key. Esa llave solo va en variables de
entorno del backend.

1. Open the Supabase dashboard.
2. Go to SQL Editor.
3. Create a new query.
4. Paste the full content of `supabase/schema.sql`.
5. Run the query.
6. Check Table Editor and confirm these tables exist:
   - `products`
   - `templates`
   - `designs`
   - `orders`
   - `order_items`
   - `payments`
   - `contact_messages`
7. Confirm the `products` table has the six seed products.
8. For existing Auth users, run:
   ```sql
   select public.backfill_profiles_from_auth();
   ```
9. For demo login/signup, email confirmation can stay enabled or disabled because
   signup is handled by the backend with `email_confirm: true`.
10. In the frontend, use only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_API_URL`
11. In the backend, use:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CORS_ORIGIN`
   - `PORT`

Never expose the Supabase secret key in the React app.

## Backend API

Run the full local stack with:

```bash
npm run dev:all
```

Main endpoints:

- `POST /api/auth/signup`: creates the Supabase Auth user, confirms email for
  demo usage, and creates `public.profiles` with `role = customer`.
- `GET /api/me`: validates the Bearer token and returns the current profile.
- `GET /api/orders`: validates the Bearer token and returns the user's orders.
- `POST /api/checkout`: validates catalog data and creates design, order and
  order item from the backend.

The SQL functions `create_my_profile` and `create_checkout_order` may remain in
the schema as compatibility helpers, but the application flow should use the
backend API above.
