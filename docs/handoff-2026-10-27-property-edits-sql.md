# פעולה נדרשת ב-Supabase: עריכות דירה שממתינות לאישור

**נוצר:** 27 באוקטובר 2026

זו לא משימת קוד. צריך להריץ את זה ידנית ב-**Supabase SQL Editor**, כמו כל שינוי סכימה קודם בפרויקט.

**בלי ההרצה הזו, עריכה של דירה מאושרת תיכשל** (בעל הדירה יקבל הודעת שגיאה), ודף הניהול לא יוכל לטעון עריכות ממתינות.

## מה זה מוסיף
טבלה חדשה בשם `property_edits`. כשבעל דירה עורך דירה שכבר **מאושרת**, השינויים נשמרים בטבלה הזו כבקשה שממתינה לאישור. הדירה באתר ממשיכה להופיע כמו שהייתה. כשמאשרים את העריכה בממשק הניהול, השינויים מוחלים על הדירה ומופיעים באתר.

## מה להריץ (ב-SQL Editor של Supabase)

```sql
create table public.property_edits (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index property_edits_one_pending_per_property
  on public.property_edits (property_id)
  where status = 'pending';

alter table public.property_edits enable row level security;

create policy "Owners can view their own property edits"
  on public.property_edits
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Owners can submit edits for their own properties"
  on public.property_edits
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.properties p
      where p.id = property_edits.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can withdraw their own pending edits"
  on public.property_edits
  for delete
  to authenticated
  using (owner_id = auth.uid() and status = 'pending');
```

## אחרי ההרצה
אפשר למזג את ה-PR. אם ה-PR מוזג לפני ההרצה, כל שאר האתר ממשיך לעבוד כרגיל. רק עריכה של דירה **מאושרת** תיכשל עד שהטבלה תיווצר.
