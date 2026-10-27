# פעולה נדרשת ב-Supabase — לפני שה-PR של "תוקף פרסום לכל דירה" מתמזג

**נוצר:** 27 באוקטובר 2026
**חשוב:** זו הרצה ידנית ב-**Supabase SQL Editor**, כמו כל שינוי סכימה קודם בפרויקט.
**צריך להריץ את זה לפני המיזוג.** הקוד החדש קורא ומסנן לפי עמודה חדשה
(`listing_expires_at`). בלי העמודה, החיפוש באתר, עמודי הדירות, האזור האישי ופאנל
הניהול ייכשלו.

## מה משתנה
- תוקף הפרסום עובר **מבעל הדירה לדירה עצמה**. עד היום התאריך נשמר על הבעלים
  (`owners.subscription_expires_at`), ולכן שינוי תאריך לדירה אחת שינה את כל הדירות שלו.
- דירה שעבר התאריך שלה **יורדת מהאתר אוטומטית** (נשארת "מאושרת" במערכת, ומופיעה
  למנהל ולבעל הדירה עם הסימון "פג תוקף").

## מה להריץ (ב-SQL Editor של Supabase, הכל ביחד)

```sql
-- 1. עמודה חדשה: עד מתי הדירה מוצגת באתר
alter table public.properties
  add column listing_expires_at timestamptz;

-- 2. העתקת התאריך הקיים מהבעלים לכל הדירות המאושרות שלו
--    (כך שאף דירה פעילה לא תיעלם מהאתר בגלל המעבר)
update public.properties p
set listing_expires_at = o.subscription_expires_at
from public.owners o
where o.id = p.owner_id
  and p.approval_status = 'approved';

-- 3. הציבור רואה רק דירות מאושרות שהתוקף שלהן לא עבר
drop policy "Public can view approved properties" on public.properties;
create policy "Public can view approved properties"
  on public.properties
  for select
  to anon, authenticated
  using (
    approval_status = 'approved'
    and (listing_expires_at is null or listing_expires_at > now())
  );
```

שימו לב: אחרי שלב 2, דירה מאושרת שהתאריך של הבעלים שלה **כבר עבר** תרד מהאתר מיד.
זו ההתנהגות הרצויה, אבל כדאי להציץ בפאנל הניהול בלשונית "פג / עומד לפוג" ולחדש
את מה שצריך (לחיצה על "מנוי עד…" בשורה של הדירה).

העמודה הישנה `owners.subscription_expires_at` לא נמחקת. היא פשוט כבר לא בשימוש.

## אחרי ההרצה
תגידו לי שזה בוצע, ואז אפשר למזג את ה-PR.
