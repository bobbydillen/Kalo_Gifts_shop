-- Orders now carry a payment choice: "test" (a test order, nothing charged) or "cod" (cash on delivery).
-- Cash on delivery is refused when any line has gift wrap, a handwritten card or a customer photo,
-- or when the order total (items plus delivery) is above 1500. The same rules are shown in the checkout.
-- Applied to the live database by patching the existing place_order function.
do $patch$
declare d text;
begin
  d := pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
  if position('v_payment' in d) > 0 then return; end if;

  d := replace(d, E'  v_weight integer := 0;\n', E'  v_weight integer := 0;\n  v_payment text;\n');

  d := replace(d, E'  v_wrap_price := coalesce(',
    E'  v_payment := coalesce(p->>''payment'', '''');\n  if v_payment not in (''cod'', ''test'') then\n    raise exception ''BAD_PAYMENT'';\n  end if;\n\n  v_wrap_price := coalesce(');

  d := replace(d, E'  v_total := v_subtotal + v_fee;\n',
    E'  v_total := v_subtotal + v_fee;\n\n  if v_payment = ''cod'' then\n    if v_total > 1500 then raise exception ''COD_NOT_AVAILABLE:amount''; end if;\n    if exists (\n      select 1 from jsonb_array_elements(v_lines) as t(l)\n       where coalesce((l->>''wrap'')::boolean, false)\n          or coalesce(l->>''card'', '''') <> ''''\n          or l->>''photo'' is not null\n          or exists (select 1 from jsonb_array_elements(coalesce(l->''parts'', ''[]''::jsonb)) as q(pt)\n                      where coalesce(pt->>''photo'', '''') <> '''')\n    ) then\n      raise exception ''COD_NOT_AVAILABLE:gift'';\n    end if;\n  end if;\n');

  d := replace(d, E'ship_line1, ship_line2, ship_city, ship_state, ship_pincode, customer_note)\n  values',
                  E'ship_line1, ship_line2, ship_city, ship_state, ship_pincode, customer_note, payment_method)\n  values');
  d := replace(d, E'v_line1, v_line2, v_city, v_state, v_pin, v_note)\n  returning id, number',
                  E'v_line1, v_line2, v_city, v_state, v_pin, v_note, v_payment)\n  returning id, number');

  if position('v_pin, v_note, v_payment)' in d) = 0 or position('COD_NOT_AVAILABLE:gift' in d) = 0 or position('BAD_PAYMENT' in d) = 0 or position('v_payment text' in d) = 0 then
    raise exception 'patch did not apply fully';
  end if;
  execute d;
end
$patch$;
