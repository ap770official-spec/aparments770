# פעולה נדרשת ב-Supabase: מחיקת דירה על ידי בעל הדירה

**נוצר:** 1 בנובמבר 2026

זו לא משימת קוד. צריך להריץ את זה ידנית ב-**Supabase SQL Editor**, כמו כל שינוי סכימה קודם בפרויקט.

## מה זה מוסיף
הרשאה לבעל דירה למחוק דירה **שלו בלבד**. השירותים, התמונות, יומן הזמינות והעריכות הממתינות של הדירה נמחקים יחד איתה.

בלי ההרצה הזו כפתור המחיקה באזור האישי יציג הודעת שגיאה, אבל שאר האתר ימשיך לעבוד כרגיל.

## מה להריץ (ב-SQL Editor של Supabase)

```sql
create policy "Owners can delete their own properties"
  on public.properties
  for delete
  to authenticated
  using (owner_id = auth.uid());
```
