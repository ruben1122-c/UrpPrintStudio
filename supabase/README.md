# Supabase setup

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
7. Confirm the function `create_checkout_order` exists under Database > Functions.
8. Confirm the `products` table has the six seed products.
9. In the frontend, use only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

Never expose the Supabase secret key in the React app.

The frontend creates orders through `create_checkout_order`, not through direct
inserts into `designs`, `orders`, and `order_items`.
