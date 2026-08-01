begin;

alter table public.hireveri_plans
  add column if not exists price_inr integer,
  add column if not exists price_usd integer;

update public.hireveri_plans
set price_inr = coalesce(price_inr, price),
    price_usd = case slug
      when 'practice-starter' then 5
      when 'practice-professional' then 12
      when 'practice-advanced' then 18
      when 'practice-career-accelerator' then 29
      else coalesce(price_usd, price)
    end;

alter table public.hireveri_plans
  alter column price_inr set not null,
  alter column price_usd set not null;

commit;
