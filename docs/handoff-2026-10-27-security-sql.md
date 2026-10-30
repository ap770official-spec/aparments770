# פעולה נדרשת ב-Supabase — תיקון אבטחה (דחוף)

**נוצר:** 27 באוקטובר 2026
**חשוב:** זו הרצה ידנית ב-**Supabase SQL Editor**, כמו כל שינוי סכימה קודם
(ראו את ההערה בראש `supabase/schema.sql`). את התיקון הזה **אפשר ורצוי
להריץ מיד**, גם לפני שה-PR ממוזג — הוא לא שובר שום דבר קיים באתר.


## ⚠️ חלק 2 — להריץ גם את זה (נוסף 30 באוקטובר 2026)
חלק 1 (למטה) **כבר הורץ ב-30 באוקטובר 2026**. אחרי שהוא הורץ, נוספו לאתר שני דברים
חדשים: עריכת דירה על ידי בעל הדירה (טבלת `property_edits`) ותוקף פרסום לכל דירה
(`listing_expires_at`). בגללם צריך לעדכן את ה-trigger:

1. **תיקון באג:** בעל דירה שהדירה שלו נדחתה ומתקן ושולח שוב — הדירה נשארת "נדחתה"
   במקום לחזור ל"ממתין לאישור", כי חלק 1 נועל את הסטטוס לגמרי. חלק 2 מתיר בדיוק את
   המעבר הזה (נדחתה → ממתין לאישור), ושום מעבר אחר.
2. **סגירת פרצה דומה:** דרך ה-API, בעל דירה יכול היה לשנות ישירות דירה **מאושרת**
   (מחיר, תיאור, תמונות, שירותים) ולעקוף את בדיקת המנהל על עריכות. עכשיו דירה מאושרת
   משתנה רק דרך בקשת עריכה שהמנהל מאשר (חוץ ממצב הזמינות, שבעל הדירה רשאי לשנות).
3. **נעילת תוקף הפרסום:** בעל דירה לא יכול להאריך לעצמו את `listing_expires_at`.

**חשוב:** להריץ אחרי ה-SQL של `docs/handoff-2026-10-27-listing-expiry-sql.md`
(שמוסיף את `listing_expires_at`), אחרת תתקבל שגיאה שהעמודה לא קיימת.

```sql
create or replace function public.protect_property_admin_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.approval_status := 'pending_approval';
      new.listing_expires_at := null;
    else
      new.owner_id := old.owner_id;
      new.created_at := old.created_at;
      new.listing_expires_at := old.listing_expires_at;
      -- The one status change an owner may make: resubmitting a
      -- rejected listing for review.
      if not (old.approval_status = 'rejected'
              and new.approval_status = 'pending_approval') then
        new.approval_status := old.approval_status;
      end if;
      -- A live listing changes only through admin review
      -- (property_edits); the owner may still flip its availability.
      if old.approval_status = 'approved'
         and (to_jsonb(new) - 'availability_mode' - 'updated_at')
             is distinct from
             (to_jsonb(old) - 'availability_mode' - 'updated_at') then
        raise exception 'Edits to an approved listing go through admin review (property_edits)';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Same rule for a live listing's photos and amenities: an owner can't
-- add, swap or remove them directly, only via property_edits.
create or replace function public.protect_live_listing_children()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if (tg_op <> 'INSERT' and exists (
          select 1 from public.properties p
          where p.id = old.property_id and p.approval_status = 'approved'))
       or (tg_op <> 'DELETE' and exists (
          select 1 from public.properties p
          where p.id = new.property_id and p.approval_status = 'approved')) then
      raise exception 'Edits to an approved listing go through admin review (property_edits)';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger protect_live_listing_amenities
  before insert or update or delete on public.property_amenities
  for each row execute function public.protect_live_listing_children();

create trigger protect_live_listing_photos
  before insert or update or delete on public.property_photos
  for each row execute function public.protect_live_listing_children();
```

**בדיקה:** `select tgname from pg_trigger where tgname like 'protect_%';` צריכה להחזיר
(בין היתר) ארבע שורות שלנו: `protect_owner_admin_columns`, `protect_property_admin_columns`,
`protect_live_listing_amenities`, `protect_live_listing_photos`.

---

# חלק 1 (כבר הורץ)

## מה הבעיה
מדיניות ה-RLS הנוכחית מאפשרת לבעל דירה לעדכן את **השורה שלו** — אבל
RLS בודק שורות, לא עמודות. כלומר בעל דירה מחובר יכול, ישירות דרך ה-API
הציבורי של Supabase (עם ה-anon key שגלוי בדפדפן + הטוקן של ההתחברות שלו),
בלי לעבור דרך האתר בכלל:

1. **לאשר לעצמו דירה** — לשנות `approval_status` ל-`approved` (או ליצור
   דירה חדשה שכבר מאושרת), ולעקוף לגמרי את אישור המנהל.
2. **להאריך לעצמו את המנוי בחינם** — לשנות `subscription_expires_at`,
   לבטל הקפאה (`is_frozen`), או לסמן את עצמו כמאומת (`is_verified`) /
   `is_first_100`.

## מה להריץ (ב-SQL Editor של Supabase)

```sql
create or replace function public.protect_owner_admin_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_verified := false;
      new.is_first_100 := false;
      new.subscription_expires_at := null;
      new.is_frozen := false;
    else
      new.id := old.id;
      new.is_verified := old.is_verified;
      new.is_first_100 := old.is_first_100;
      new.subscription_expires_at := old.subscription_expires_at;
      new.is_frozen := old.is_frozen;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_owner_admin_columns
  before insert or update on public.owners
  for each row execute function public.protect_owner_admin_columns();

create or replace function public.protect_property_admin_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.approval_status := 'pending_approval';
    else
      new.approval_status := old.approval_status;
      new.owner_id := old.owner_id;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_property_admin_columns
  before insert or update on public.properties
  for each row execute function public.protect_property_admin_columns();
```

## מה זה עושה
שני triggers שנועלים את העמודות של המנהל עבור משתמשי האתר (`anon`,
`authenticated`): ביצירה הם מקבלים את ערך ברירת המחדל, ובעדכון הם נשארים
עם הערך הקודם — כל ניסיון לשנות אותם פשוט מתעלם. פאנל הניהול עובד עם
ה-service_role key ולכן ממשיך לאשר/לדחות/להאריך מנוי כרגיל.

## איך לבדוק שזה עבד
1. באתר: פרסום דירה חדשה עדיין עובד ומגיע כ"ממתין לאישור".
2. בפאנל הניהול: אישור דירה עדיין עובד ומעדכן את תאריך המנוי.

## אחרי ההרצה
מומלץ לעבור על טבלת `properties` ולוודא שאין דירה במצב `approved` שלא
אישרתם בעצמכם, ועל `owners` לוודא שאין `subscription_expires_at` שלא
נקבע מהפאנל.
