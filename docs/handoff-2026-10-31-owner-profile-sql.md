# פעולה נדרשת ב-Supabase: פרטי בעל הדירה

**נוצר:** 31 באוקטובר 2026

זו לא משימת קוד. צריך להריץ את זה ידנית ב-**Supabase SQL Editor**, כמו כל שינוי סכימה קודם בפרויקט.

## מה זה מוסיף
עמודות חדשות בטבלת `owners`: שם פרטי, שם משפחה, טלפון, הקשר לדירה, איך שמעו עלינו, ומתי אושרו תנאי השימוש ומתי הושלמו הפרטים. בעל דירה ממלא אותן פעם אחת, במסך "כמה פרטים לפני שמתחילים" שמופיע אחרי הכניסה.

**בלי ההרצה הזו, האזור האישי של בעלי הדירות ודף הדירה בממשק הניהול לא ייטענו** (הקוד קורא את העמודות החדשות). לכן צריך להריץ אותה **לפני** מיזוג ה-PR.

## מה להריץ (ב-SQL Editor של Supabase)

```sql
alter table public.owners
  add column first_name text,
  add column last_name text,
  add column phone_country_code text,
  add column phone_number text,
  add column owner_role text
    check (owner_role in ('owner', 'manager', 'other')),
  add column referral_source text
    check (referral_source in ('friend', 'whatsapp', 'google', 'social', 'ad', 'other')),
  add column referral_other text,
  add column terms_accepted_at timestamptz,
  add column profile_completed_at timestamptz;
```

ההרצה רק מוסיפה עמודות ריקות. היא לא משנה ולא מוחקת נתונים קיימים.

אם מופיעה השגיאה `column "first_name" of relation "owners" already exists`, הקוד כבר רץ פעם אחת. אין צורך להריץ אותו שוב.
