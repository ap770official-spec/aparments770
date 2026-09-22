# Apartments770 — סיכום מצב הפרויקט

**עדכון אחרון:** 22 בספטמבר 2026
**מטרת המסמך:** נקודת המשך ברורה — לך, ולכל שיחת Claude עתידית שתמשיך את הפרויקט הזה.
קרא את זה קודם כל, לפני שממשיכים לבנות.

---

## 1. הרעיון בקצרה

אתר תיווך לדירות להשכרה לטווח קצר בשתי שכונות בניו יורק (Crown Heights ו-"האוהל"),
מיועד בעיקר לקהילה שנוסעת בין שני המקומות. בעלי דירות מפרסמים, שוכרים מחפשים ופונים
בוואטסאפ — התשלום עצמו תמיד ישיר בין הצדדים, לא דרך האתר. מודל הכנסה: 100 הראשונים
חינם, אח"כ מנוי (נגבה ידנית, לא חלק מה-MVP).

מסמכי הרקע המלאים נמצאים ב-`docs/planning-updates-2026-09-20.md` (עדכוני התכנון
שנשלחו אחרי ה-PDF המקורי).

---

## 2. טכנולוגיה וחשבונות

| רכיב | שירות | סטטוס |
|---|---|---|
| קוד | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | ✅ |
| שפות | next-intl — עברית (ברירת מחדל, RTL) + אנגלית | ✅ |
| מסד נתונים + התחברות | Supabase (Postgres + Auth), אזור ארה"ב | ✅ |
| תמונות/וידאו | Cloudinary (cloud name: `mzzrwzba`) | ✅ |
| מפות | Mapbox — **טוקן קיים, אבל עדיין לא מחובר בקוד** | ⏳ ראה סעיף 6 |
| אחסון/הרצה | Vercel, מחובר אוטומטית ל-GitHub | ✅ |
| קוד מקור | GitHub: `ap770official-spec/aparments770`, ענף `claude/apartments770-basic-setup-oqzbfi` | ✅ |
| אתר חי | https://aparments770.vercel.app | ✅ (עדיין לא דומיין אמיתי — יש דומיין קנוי, לא מחובר) |

**חשבונות שנפתחו:** Supabase, Mapbox, Cloudinary, Google Cloud (לצורך Google Sign-In),
Vercel. כולם עם המייל/חשבונות שלך.

### משתני סביבה (6, לא בקוד המשוכפל)
נמצאים ב-`.env.local` (מקומי, לא ב-Git) **וגם** בהגדרות הפרויקט ב-Vercel (Production +
Preview) — צריך לעדכן בשני המקומות אם ערך משתנה:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```
המפתחות של Supabase/Mapbox הוחלפו (rotated) פעם אחת באמצע הפרויקט אחרי שנחשפו בטעות
בשיחה אחרת — הערכים הנוכחיים תקפים.

### Google Sign-In
פרויקט Google Cloud בשם `Apartments770`, OAuth Client ID מסוג Web application,
עם Authorized redirect URI: `https://ucdqvntoljvrbmqzrehn.supabase.co/auth/v1/callback`.
מוגדר ב-Supabase ← Authentication ← Sign In / Providers ← Google.
**Apple Sign-In נדחה** (דורש Apple Developer בתשלום, ~$99/שנה) — ראה סעיף 6.

### Cloudinary — Upload Preset
Preset הנוכחי בשימוש: `xsqxl7fz` (Unsigned). מוגדרת עליו **Incoming Transformation**:
`w_1920,h_1920,c_limit,q_auto` (מקטין/דוחס אוטומטית תמונות ווידאו בהעלאה). בקוד, כל
תמונה מוצגת דרך `optimizedCloudinaryUrl()` שמוסיפה גם `f_auto,q_auto` לתצוגה.
(שני presets ישנים, `svpikqwk` ו-`nitpzrrq`, לא בשימוש — אפשר למחוק, לא דחוף.)

---

## 3. מסד הנתונים

כל ה-SQL המקורי שהרצנו ידנית מתועד ב-**`supabase/schema.sql`** (מעודכן, כולל
RLS policies). חמש טבלאות:

1. **regions** — רשימת אזורים גמישה (לא קשיחה בקוד). שתי שורות זרעוניות:
   `crown-heights` (770 Eastern Parkway) ו-`the-ohel` (226-20 Francis Lewis Blvd).
   `landmark_lat/lng` עדיין ריקים (ממתין למיפוי, סעיף 6).
2. **owners** — פרופיל בעל דירה, `id` = אותו `id` מ-Supabase Auth. נוצר אוטומטית
   בכניסה ראשונה לדשבורד (לא טופס הרשמה נפרד).
3. **properties** — הדירות. שני שדות סטטוס נפרדים: `approval_status` (ניהולי:
   pending_approval/approved/rejected) ו-`availability_mode` (של הבעלים עצמו).
   `lat/lng/walking_minutes_to_landmark` ריקים.
4. **property_amenities** — שורה לכל (דירה, שירות) במקום עמודות בוליאניות — קל
   להוסיף שירותים עתידיים בלי לשנות מבנה.
5. **property_photos** — קישורי Cloudinary בלבד (לא הקבצים עצמם), `media_type`
   image/video, `sort_order` קובע איזו ראשונה.

RLS: ציבור רואה רק `approved`; בעלים רואים/עורכים רק את שלהם.

### נתוני בדיקה שכבר קיימים
- **דירה 1** (`556 Albany Ave`, Crown Heights) — הוכנסה ידנית ב-SQL, מאושרת מההתחלה,
  משויכת למשתמש-דוגמה שנוצר ידנית ב-Supabase Auth (לא חשבון אמיתי שלך).
- **דירה 2** — נוצרה דרך **הטופס האמיתי** באתר, תחת חשבון ה-Google האמיתי שלך,
  אושרה ידנית אחר כך דרך SQL (`UPDATE properties SET approval_status='approved'`).

---

## 4. מבנה הקוד — איפה מה נמצא

```
messages/he.json, en.json          כל הטקסטים (תרגומים), לפי namespace
src/
  i18n/routing.ts, navigation.ts   הגדרת עברית/אנגלית, Link/useRouter מודעי-שפה
  proxy.ts                         מאחד: ניתוב שפה + רענון סשן Supabase
  lib/
    supabase/public.ts             לקוח Supabase לקריאה ציבורית (anon key)
    supabase/server.ts             לקוח Supabase לקומפוננטות שרת (עוגיות משתמש)
    supabase/browser.ts            לקוח Supabase לקומפוננטות דפדפן
    regions.ts, properties.ts      שאילתות DB + טיפוסים (Region, PropertySummary...)
    owners.ts                      יצירת שורת owners אוטומטית
    cloudinary.ts                  העלאת קבצים + אופטימיזציית URL לתצוגה
    whatsapp.ts                    בניית קישור wa.me עם הודעה מוכנה מראש
  components/
    Header.tsx                     לוגו + המבורגר + בורר שפה
    SearchForm.tsx                 טופס חיפוש בעמוד הבית
    PropertyCard.tsx               כרטיס דירה בתוצאות חיפוש
    PropertyForm.tsx               הטופס הגדול לפרסום דירה
    GoogleLoginButton, EmailOtpForm, LogoutButton
  app/[locale]/
    page.tsx                       עמוד בית (מי אנחנו + בורר אזור + חיפוש)
    search/page.tsx                תוצאות חיפוש אמיתיות
    property/[id]/page.tsx         דף דירה + וואטסאפ
    owner/login, owner/dashboard, owner/properties/new
    about, articles, contact, recommendations   "בקרוב" (placeholder)
    list-property/page.tsx         מנתב: מחובר→טופס, לא מחובר→login
  app/auth/callback/route.ts       יעד ה-OAuth של Google (לא תחת [locale] בכוונה)
```

---

## 5. מה בנוי ועובד (מאומת בפועל, לא רק בקוד)

- ✅ פרויקט Next.js ריק, בנייה ולינט נקיים
- ✅ מסד נתונים מלא עם RLS
- ✅ שלד אתר: לוגו, תפריט המבורגר (5 פריטים), בורר שפה, RTL/LTR
- ✅ עמוד בית: טקסט "מי אנחנו" + בורר אזור (חי מה-DB) + טופס חיפוש
- ✅ תוצאות חיפוש אמיתיות (מסונן לפי אזור + מספר אורחים)
- ✅ דף דירה: תמונות/וידאו, שירותים לפי קטגוריה, כפתור וואטסאפ עם הודעה
  שכוללת אוטומטית תאריכים ומספר אורחים
- ✅ פריסה חיה ל-Vercel, מתעדכנת אוטומטית בכל push
- ✅ התחברות Google לבעלי דירות — עובד מקצה לקצה
- ✅ דשבורד: יוצר "כרטיס בעלים" אוטומטית, מציג את הדירות שלי + סטטוס אישור
- ✅ טופס פרסום דירה מלא: כל השדות, 16 שירותים, העלאת תמונות/וידאו ל-Cloudinary
  עם דחיסה אוטומטית — **נבדק בפועל עם דירה אמיתית**
- ✅ המסלול השלם: פרסום → ממתין לאישור → אישור ידני (SQL) → מופיע בחיפוש הציבורי

---

## 6. מה נשאר פתוח / נדחה במכוון

הרשימה המלאה עם הסברים ב-**`docs/known-limitations.md`**. בקצרה:

| נושא | סטטוס | מה צריך כדי להמשיך |
|---|---|---|
| **מפה + מרחק הליכה** | לא מחובר בקוד בכלל | להחליט קודם: **עכשיו** (לפני שלב ו') או **אחרי שלב ו'**? (נשאלת שאלה זו, טרם נענתה) |
| **פאנל ניהול (שלב ו')** | לא קיים — אישור דירות נעשה ידנית ב-SQL | הכי דחוף לבנות, כי ה-SQL הידני מסורבל |
| אימות OTP במייל | קוד לא מוצג במייל | דורש חיבור SMTP חיצוני (מומלץ Resend) |
| Apple Sign-In | נדחה | דורש חשבון Apple Developer בתשלום |
| דירוג/ביקורות | לא קיים (שלב 2 במסמך המקורי) | טבלה + זרימה חדשה |
| סינון לפי תאריכים ספציפיים | חיפוש מסנן רק לפי אזור+אורחים | טבלת זמינות לפי תאריך |
| שכפול דירה / ניהול תפוסה (ה'-5) | לא קיים | UI קטן יחסית |
| עיצוב חזותי/מותג | נדחה בכוונה לסוף | עיצוב Tailwind נקי בינתיים, בכוונה |

---

## 7. איך ממשיכים מחר

1. תגיד ל-Claude "תמשיך מהמסמך `docs/project-status.md`" (או פשוט תתאר מה אתה רוצה —
   המסמך הזה כבר בגיטהאב, כל שיחה חדשה יכולה לקרוא אותו)
2. **החלטה ראשונה שמחכה לך:** מפה עכשיו או אחרי פאנל הניהול?
3. תזכורת לעצמך על אופן העבודה שסיכמנו: לפני כל פעולה — הסבר קודם, ולחכות לאישור שלך.

**קישורים שימושיים:**
- אתר חי: https://aparments770.vercel.app
- קוד: https://github.com/ap770official-spec/aparments770/tree/claude/apartments770-basic-setup-oqzbfi
- מסד נתונים: פרויקט Supabase שלך (`ucdqvntoljvrbmqzrehn`)
