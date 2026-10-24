-- Keep the product catalog and existing orders readable while stopping
-- visitors from creating orders directly through the public Supabase API.
drop policy if exists "Anyone can create orders" on public.orders;

-- The public proof RPC is security definer, so it also needs an explicit gate.
create or replace function public.mark_order_waiting_verification(order_no text, proof_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Store payments are temporarily closed' using errcode = 'P0001';
end;
$$;
