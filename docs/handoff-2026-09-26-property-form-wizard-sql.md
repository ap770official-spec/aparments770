# פעולה נדרשת ב-Supabase — לפני שה-PR הזה עולה לאוויר

**נוצר:** 26 בספטמבר 2026
**חשוב:** זו לא משימת קוד — זו הרצה ידנית ב-**Supabase SQL Editor**, בדיוק
כמו כל שינוי סכימה קודם בפרויקט הזה (ראו את ההערה בראש
`supabase/schema.sql`). **בלי להריץ את זה קודם, טופס פרסום הדירה החדש
(PR עם השדרוג ל"אשף 5 שלבים") יישבר** — הוא שולח שדה חדש (`property_type`)
ושמות שירותים חדשים שה-DB עדיין לא מכיר.

## מה להריץ (ב-SQL Editor של Supabase, בסדר הזה)

```sql
-- 1. שדה חדש: סוג הדירה (דירה בבניין / בית פרטי / בייסמנט)
alter table public.properties
  add column property_type text not null default 'apartment'
  check (property_type in ('apartment', 'house', 'basement'));

-- 1ב. שדה חדש: הערות נוספות לאיתור הכתובת (שדה רשות, טקסט חופשי)
alter table public.properties
  add column address_notes text;

-- 2. הרחבת רשימת השירותים המותרים — היום יש רשימה סגורה (whitelist) שתחסום
--    את כל השירותים החדשים. מסירים את שתי המגבלות (category, amenity_key)
--    ומשאירים רק not null - כמו שהכוונה המקורית הייתה בהערה שכבר יש
--    בסכימה ("so new amenity types can be added later without a schema
--    change"). הבקרה בפועל היא באפליקציה, לא ב-DB, מה שממילא כבר נכון
--    לכל שדה טקסט חופשי אחר בטבלאות האלה.
alter table public.property_amenities drop constraint if exists property_amenities_category_check;
alter table public.property_amenities drop constraint if exists property_amenities_amenity_key_check;
```

## אחרי ההרצה
תגידו לי (בצ'אט הניהול) שזה בוצע, ואני אוודא מול הקוד שהכל מסתדר לפני
שממליץ למזג את ה-PR.

**חשוב:** אם ה-PR כבר מוזג לפני שזה רץ — האתר החי ימשיך לעבוד לגמרי רגיל
לכל דבר קיים (חיפוש, דירות קיימות, כניסה וכו'). רק **פרסום דירה חדשה**
ייכשל בשליחה (הודעת שגיאה כללית) עד שהשדה/המגבלות יעודכנו.
