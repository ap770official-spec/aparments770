# משימה להעברה ל-Claude Code — הסרת בורר אזורים

**נוצר:** 22 בספטמבר 2026
**מקור:** סוכם בצ'אט ניהול נפרד (לא כאן), הועבר לביצוע בצ'אט הזה.
**החלטה:** האתר יתמקד מעתה באזור אחד בלבד — **Crown Heights**. אזור "האוהל"
(`the-ohel`) יוצא משימוש (לא נמחק ממסד הנתונים, רק מושבת).

לפני שמתחילים: `git pull` על הענף `claude/cool-babbage-ni41d3` כדי לוודא סנכרון
מלא עם מה שכבר קיים.

---

## מה לעשות

### 1. מסד נתונים (Supabase)
בטבלת `regions`, לעדכן את השורה עם `slug = 'the-ohel'`:
```sql
update regions set is_active = false where slug = 'the-ohel';
```
לא למחוק את השורה — רק להשבית. `getActiveRegions()` וגם `getRegionBySlug()`
ב-`src/lib/regions.ts` כבר מסננים לפי `is_active = true`, אז זה משפיע אוטומטית
על כל מקום שמושך רשימת אזורים פעילים.

### 2. `src/components/SearchForm.tsx`
כרגע הקומפוננטה מקבלת `regions: Region[]` ומרנדרת `<select>` לבחירת אזור
(שורות 35-49). אחרי ההשבתה ב-DB, המערך `regions` יכיל פריט יחיד (Crown
Heights). יש להסיר את שדה הבחירה מהתצוגה למשתמש, ולהמשיך לשלוח את
`region=<slug>` ב-query params של החיפוש (שורות 20-27) עם הערך היחיד שקיים
(`regions[0]?.slug`) — בלי תיבת בחירה גלויה. אין צורך למחוק את ה-prop
`regions` מהקומפוננטה (עדיין נדרש כדי לדעת מה ה-slug הפעיל), רק את ה-JSX
של ה-`<label>`/`<select>`.

### 3. `src/components/PropertyForm.tsx`
אותו דפוס: `regionId` state (שורה 66-67) ותיבת בחירה סביב שורה 238-245+.
להסיר את תיבת הבחירה מהתצוגה, ולהמשיך למלא `regionId` אוטומטית מ-
`regions[0]?.id` (כברירת המחדל היחידה, כל עוד לא בעריכת דירה קיימת עם
`initialProperty?.region_id` אחר — את הלוגיקה הזו לא לשנות, רק את ה-JSX
הגלוי).

### 4. מה לא לגעת בו
- מבנה טבלת `regions` במסד הנתונים — נשאר כמו שהוא.
- `src/app/admin/**` — עמודת "אזור" בטבלת הדירות בפאנל הניהול נשארת כמו
  שהיא (ההחלטה כרגע היא לא להסתיר אותה שם).
- דירות קיימות במסד הנתונים — כולן כבר משויכות ל-Crown Heights, אין צורך
  בהעברת נתונים.
- `src/lib/regions.ts`, `src/lib/properties.ts`, `src/lib/supabase/public.ts`,
  `src/app/[locale]/search/page.tsx`, `src/app/[locale]/property/[id]/page.tsx`,
  `src/lib/subscription-pdf.ts`, `src/app/admin/geocode-actions.ts`,
  `src/app/admin/actions.ts`, `src/app/[locale]/owner/properties/new/page.tsx`
  — כל אלה מזכירים `region`/`regionId` אבל רק כערך/שדה, לא כתיבת בחירה
  למשתמש. לוודא (`grep -ri region src`) שאין שם עוד `<select>`/UI לבחירת
  אזור שהוחמצ — אם כן, להחיל עליו את אותו טיפול כמו בסעיפים 2-3.

---

## בדיקת קבלה (לפני push)
1. `npm run build` עובר בלי שגיאות.
2. בדף הבית ⁠— טופס החיפוש לא מציג שדה/תיבת בחירה לאזור.
3. בטופס פרסום דירה (owner) — לא מוצגת תיבת בחירה לאזור, והדירה נשמרת עם
   `region_id` של Crown Heights.
4. חיפוש עדיין מחזיר את הדירות הקיימות (שכולן ב-Crown Heights).
5. עמוד `/admin/properties` עדיין מציג את עמודת האזור כרגיל, לא נשבר.

## לאחר סיום
לעדכן את `docs/project-status.md` (סעיף "מה נשאר פתוח") ולהסיר/לעדכן את
השורה שהתייחסה לשני אזורים, ולסמן שהאתר כרגע ממוקד ב-Crown Heights בלבד.
