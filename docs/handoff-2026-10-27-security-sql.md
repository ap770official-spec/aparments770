# פעולה נדרשת ב-Supabase — תיקון אבטחה (דחוף)

**נוצר:** 27 באוקטובר 2026
**חשוב:** זו הרצה ידנית ב-**Supabase SQL Editor**, כמו כל שינוי סכימה קודם
(ראו את ההערה בראש `supabase/schema.sql`). את התיקון הזה **אפשר ורצוי
להריץ מיד**, גם לפני שה-PR ממוזג — הוא לא שובר שום דבר קיים באתר.

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
