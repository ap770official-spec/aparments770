# פעולה נדרשת ב-Supabase: יומן זמינות

**נוצר:** 1 בנובמבר 2026

זו לא משימת קוד. צריך להריץ את זה ידנית ב-**Supabase SQL Editor**, כמו כל שינוי סכימה קודם בפרויקט.

## מה זה מוסיף
טבלה חדשה בשם `property_availability_dates`. בעלי הדירות מסמנים בה ביומן הזמינות לילות תפוסים או לילות פנויים. החיפוש באתר קורא את הטבלה כדי להסתיר דירות שלא פנויות בכל הלילות שהאורח ביקש.

**צריך להריץ את זה לפני מיזוג ה-PR.** בלי הטבלה, החיפוש ויומן הזמינות ייכשלו.

## מה להריץ (ב-SQL Editor של Supabase)

```sql
create table public.property_availability_dates (
  property_id uuid not null references public.properties(id) on delete cascade,
  date date not null,
  status text not null check (status in ('blocked', 'open')),
  primary key (property_id, date)
);

alter table public.property_availability_dates enable row level security;

create policy "Public can view availability of approved properties"
  on public.property_availability_dates
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_availability_dates.property_id
        and p.approval_status = 'approved'
    )
  );

create policy "Owners can view availability of their own properties"
  on public.property_availability_dates
  for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_availability_dates.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can add availability for their own properties"
  on public.property_availability_dates
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_availability_dates.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can change availability of their own properties"
  on public.property_availability_dates
  for update
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_availability_dates.property_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_availability_dates.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can remove availability of their own properties"
  on public.property_availability_dates
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_availability_dates.property_id
        and p.owner_id = auth.uid()
    )
  );
```

ההרצה רק יוצרת טבלה חדשה. היא לא משנה ולא מוחקת נתונים קיימים.
