-- Pay online through Cashfree (UPI, cards, net banking, wallets).
-- The order is placed first as payment_method 'prepaid' with payment pending (so stock is held), then
-- the customer pays on Cashfree's checkout. The website's server marks it paid only after Cashfree
-- itself confirms the payment (a signed notice, or asking Cashfree for the order), and stores
-- Cashfree's payment id in payment_ref. That update uses the server-only secret key.

do $patch$
declare d text;
begin
  d := pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
  if position($q$'cod', 'test', 'upi', 'prepaid'$q$ in d) > 0 then return; end if;
  d := replace(d, $q$v_payment not in ('cod', 'test', 'upi')$q$, $q$v_payment not in ('cod', 'test', 'upi', 'prepaid')$q$);
  if position($q$'cod', 'test', 'upi', 'prepaid'$q$ in d) = 0 then raise exception 'patch did not apply'; end if;
  execute d;
end
$patch$;
