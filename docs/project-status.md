# Apartments770 — סיכום מצב הפרויקט

**עדכון אחרון:** 22 בספטמבר 2026, אחה"צ
**מטרת המסמך:** נקודת המשך ברורה — לך, ולכל שיחת Claude עתידית שתמשיך את הפרויקט הזה.
קרא את זה קודם כל, לפני שממשיכים לבנות.

**הערה חשובה:** בשלב מסוים היו שני branches מקבילים (עבודה כאן + עבודה בצ'אט Claude Code
נפרד תחת אותו פרויקט). הם מוזגו, ומאז שני הצדדים דואגים לסנכרן (`git pull`/`push`) לפני
ואחרי כל עבודה. אם אתה (או שיחה עתידית) עובד/ת מכאן — **תמיד `git pull` קודם**.

---

## 1. הרעיון בקצרה

אתר תיווך לדירות להשכרה לטווח קצר בשתי שכונות בניו יורק (Crown Heights ו-"האוהל"),
מיועד בעיקר לקהילה שנוסעת בין שני המקומות. בעלי דירות מפרסמים, שוכרים מחפשים ופונים
בוואטסאפ — התשלום עצמו תמיד ישיר בין הצדדים, לא דרך האתר (מתנהל ידנית: העברה/וואטסאפ,
ואישור מנהל האתר פותח תוקף מנוי לשנה, ראה סעיף 5).

מסמכי הרקע המלאים נמצאים ב-`docs/planning-updates-2026-09-20.md` (עדכוני התכנון
שנשלחו אחרי ה-PDF המקורי).

---

## 2. טכנולוגיה וחשבונות

| רכיב | שירות | סטטוס |
|---|---|---|
| קוד | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | ✅ |
| שפות | next-intl — עברית (ברירת מחדל, RTL) + אנגלית | ✅ |
| מסד נתונים + התחברות | Supabase (Postgres + Auth), אזור ארה"ב | ✅ |
| התחברות בעלי דירות | Google OAuth + מייל/OTP (Resend SMTP) | ✅ שניהם עובדים |
| תמונות/וידאו | Cloudinary (cloud name: `mzzrwzba`) | ✅ |
| מפות | Mapbox — מחובר בקוד (מיקום מדויק + מפה + מרחק הליכה) | ✅ |
| מיילים מהשרת (לא Auth) | Resend API ישיר, מדומיין מאומת `apartments770.com` | ✅ |
| אחסון/הרצה | Vercel, מחובר אוטומטית ל-GitHub | ✅ |
| קוד מקור | GitHub: `ap770official-spec/aparments770`, ענף `claude/apartments770-basic-setup-oqzbfi` | ✅ |
| אתר חי | https://aparments770.vercel.app | ✅ (יש דומיין `apartments770.com` קנוי, אומת ל-Resend, אבל **לא** מחובר עדיין כדומיין של האתר עצמו ב-Vercel) |

**חשבונות שנפתחו:** Supabase, Mapbox, Cloudinary, Google Cloud (Google Sign-In), Resend,
Vercel, Spaceship (רישום הדומיין). כולם עם המייל/חשבונות שלך.

### משתני סביבה
נמצאים ב-`.env.local` (מקומי, לא ב-Git) **וגם** בהגדרות הפרויקט ב-Vercel (Production +
Preview) — צריך לעדכן בשני המקומות אם ערך משתנה:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ADMIN_PASSWORD          # שער כניסה יחיד ל-/admin, לא קשור ל-Supabase Auth
RESEND_API_KEY          # לשליחת מיילים מהשרת (לא מיילי ה-Auth, אלה עוברים ב-SMTP של Supabase)
```
מפתחות Supabase/Mapbox הוחלפו (rotated) פעם אחת באמצע הפרויקט אחרי שנחשפו בטעות בשיחה
אחרת — הערכים הנוכחיים תקפים. **`ADMIN_PASSWORD` נוצר כסיסמה זמנית אקראית** — כדאי
להחליף לסיסמה משלך אם עוד לא נעשה.

### Google Sign-In
פרויקט Google Cloud בשם `Apartments770`, OAuth Client ID מסוג Web application, עם
Authorized redirect URI: `https://ucdqvntoljvrbmqzrehn.supabase.co/auth/v1/callback`.
מוגדר ב-Supabase ← Authentication ← Sign In / Providers ← Google.
**Apple Sign-In נדחה** (דורש Apple Developer בתשלום, ~$99/שנה).

### מייל — שני נתיבים נפרדים
1. **מיילי Auth** (OTP/Magic Link) — עוברים דרך Supabase, שמוגדר לשלוח דרך **Resend
   SMTP**. תבניות "Confirm sign up" ו-"Magic link" כוללות `{{ .Token }}` גלוי.
2. **מיילים שהאפליקציה שלנו שולחת ביוזמתה** (כרגע: אישור פרסום דירה + PDF) — עוברים
   ב-`src/lib/email.ts`, קריאה ישירה ל-Resend API (`RESEND_API_KEY`), לא דרך Supabase.

שני הנתיבים משתמשים באותו חשבון Resend, עם דומיין שולח מאומת (`apartments770.com`) —
מיילים מגיעים לכל כתובת יעד, לא רק לכתובת בדיקה אחת.

### Cloudinary — Upload Preset
Preset בשימוש: `xsqxl7fz` (Unsigned), עם **Incoming Transformation**
`w_1920,h_1920,c_limit,q_auto` (דחיסה אוטומטית בהעלאה). בקוד, כל תמונה מוצגת דרך
`optimizedCloudinaryUrl()` שמוסיפה `f_auto,q_auto` לתצוגה. (שני presets ישנים לא
בשימוש, `svpikqwk` ו-`nitpzrrq` — אפשר למחוק, לא דחוף.)

### Mapbox
טופס פרסום דירה: בעל הדירה מסמן מיקום מדויק על מפה (`LocationPicker.tsx` — חיפוש כתובת
+ סיכה נגררת, לא geocoding אוטומטי מהכתובת החופשית). עמוד דירה ציבורי: מפה עם שתי סיכות
(הדירה + נקודת הציון) וזמן הליכה אמיתי (Mapbox Directions API, לא קו אווירי). קואורדינטות
לאזורים ולדירות ישנות (שפורסמו לפני ה-picker) מולאו דרך שני כלים חד-פעמיים בפאנל הניהול.

---

## 3. מסד הנתונים

כל ה-SQL המקורי מתועד ב-**`supabase/schema.sql`** (כולל RLS policies). חמש טבלאות:

1. **regions** — רשימה גמישה. שתי שורות: `crown-heights`, `the-ohel`.
   `landmark_lat/lng` **כן מלאים כעת** (מולאו דרך Mapbox, ראה סעיף 2).
2. **owners** — פרופיל בעל דירה, `id` = Supabase Auth id, נוצר אוטומטית בכניסה ראשונה
   לדשבורד. `subscription_expires_at` + `is_frozen` מתעדכנים כשמנהל האתר מאשר דירה
   (ראה סעיף 5, מודל התשלום).
3. **properties** — הדירות. `approval_status` (ניהולי) ו-`availability_mode` (של
   הבעלים) נפרדים. `lat/lng/walking_minutes_to_landmark` **כן מלאים** לדירות חדשות
   (דרך ה-picker) ולרוב הישנות (geocoding חד-פעמי מהכתובת).
4. **property_amenities** — שורה לכל (דירה, שירות), לא עמודות בוליאניות.
5. **property_photos** — קישורי Cloudinary בלבד, `media_type` image/video.

RLS: ציבור רואה רק `approved`; בעלים רואים/עורכים רק את שלהם; `/admin` עוקף RLS
לגמרי (service_role key, שרת בלבד).

### נתוני בדיקה שכבר קיימים
- **דירה 1** (`556 Albany Ave`, Crown Heights) — הוכנסה ידנית ב-SQL, מאושרת מההתחלה,
  משויכת למשתמש-דוגמה שנוצר ידנית ב-Supabase Auth (לא חשבון אמיתי שלך).
- **דירה 2** — נוצרה דרך הטופס האמיתי, תחת חשבון ה-Google האמיתי שלך, אושרה ידנית.

---

## 4. מבנה הקוד — איפה מה נמצא

```
messages/he.json, en.json          כל הטקסטים (תרגומים), לפי namespace
src/
  i18n/routing.ts, navigation.ts   הגדרת עברית/אנגלית, Link/useRouter מודעי-שפה
  proxy.ts                         מאחד: ניתוב שפה + רענון סשן Supabase (לא רץ על /admin, /auth)
  lib/
    supabase/public.ts             לקוח Supabase לקריאה ציבורית (anon key)
    supabase/server.ts             לקוח Supabase לקומפוננטות שרת (עוגיות משתמש)
    supabase/browser.ts            לקוח Supabase לקומפוננטות דפדפן
    supabase/admin.ts              לקוח עם service_role key - שרת בלבד, /admin בלבד
    regions.ts, properties.ts      שאילתות DB + טיפוסים
    owners.ts                      יצירת שורת owners אוטומטית
    cloudinary.ts                  העלאת קבצים + אופטימיזציית URL לתצוגה
    whatsapp.ts                    בניית קישור wa.me עם הודעה מוכנה מראש
    mapbox.ts                      Geocoding + Directions API (מרחק הליכה)
    email.ts                       שליחת מייל מהשרת דרך Resend API (לא Supabase SMTP)
    subscription-pdf.ts            יצירת PDF אישור פרסום (pdf-lib + פונט עברי מוטמע)
    admin-auth.ts                  בדיקת סיסמת מנהל (עוגייה, לא Supabase Auth)
    fonts/noto-sans-hebrew-400.woff2  פונט מוטמע ל-PDF (subset עברי בלבד)
  components/
    Header.tsx, SearchForm.tsx, PropertyCard.tsx
    PropertyForm.tsx                טופס פרסום/עריכה (תומך בשכפול, initialProperty)
    LocationPicker.tsx              בחירת מיקום על מפה בטופס
    Map.tsx                        תצוגת מפה (Mapbox GL JS) בדף הדירה
    AvailabilityModeSelect.tsx      בורר מצב תפוסה בדשבורד
    GoogleLoginButton, EmailOtpForm, LogoutButton
  app/[locale]/
    page.tsx, search/page.tsx, property/[id]/page.tsx
    owner/login, owner/dashboard, owner/properties/new (תומך ב-?duplicate=<id>)
    owner/actions.ts                Server Action: עדכון availability_mode
    about, articles, contact, recommendations   "בקרוב" (placeholder)
    list-property/page.tsx         מנתב: מחובר→טופס, לא מחובר→login
  app/auth/callback/route.ts       יעד ה-OAuth של Google (לא תחת [locale] בכוונה)
  app/admin/                       פאנל ניהול - לא תחת [locale], לא דו-לשוני
    layout.tsx                    root layout (תוקן חוסר עיצוב)
    login/page.tsx
    properties/page.tsx            טבלת כל הדירות + אשר/דחה + טלפון/וואטסאפ ישיר
    properties/[id]/page.tsx       עמוד פרטים מלא לדירה בודדת
    actions.ts                     אישור/דחיית דירה, כולל פתיחת מנוי + PDF
    geocode-actions.ts              כלים חד-פעמיים למילוי קואורדינטות
```

---

## 5. מה בנוי ועובד

- ✅ פרויקט Next.js, מסד נתונים מלא עם RLS
- ✅ שלד אתר: לוגו, תפריט המבורגר, בורר שפה, RTL/LTR
- ✅ עמוד בית + חיפוש אמיתי (אזור + אורחים)
- ✅ דף דירה: תמונות/וידאו, שירותים, וואטסאפ עם הודעה מוכנה, **מפה + מרחק הליכה אמיתי**
- ✅ פריסה חיה ל-Vercel, מתעדכנת אוטומטית בכל push
- ✅ התחברות Google **וגם** מייל+OTP (שניהם עובדים, לכל כתובת מייל)
- ✅ דשבורד: יוצר "כרטיס בעלים" אוטומטית, רשימת דירות + סטטוס, שכפול דירה, בורר מצב תפוסה
- ✅ טופס פרסום דירה מלא: כל השדות, 16 שירותים, תמונות/וידאו דחוסים, **מיקום מדויק על מפה**
- ✅ המסלול השלם: פרסום → ממתין לאישור → אישור בפאנל ניהול → מופיע בחיפוש הציבורי

### פאנל ניהול (`/admin`, מוגן ב-`ADMIN_PASSWORD`)
- ✅ `/admin/properties` — טבלת כל הדירות: סטטוס, טלפון/וואטסאפ ישיר, אשר/דחה, כלי
  מילוי-קואורדינטות חד-פעמיים
- ✅ `/admin/properties/[id]` — עמוד פרטים מלא לדירה בודדת (גלריה, כל הנתונים, גישה
  ישירה לבעל הדירה)
- ✅ **מודל תשלום**: אין סליקה באתר. לחיצת "אשר" = גם אישור תשלום שבוצע ידנית מחוץ
  למערכת: המנהל בוחר תאריך תוקף (ברירת מחדל שנה), המערכת מעדכנת
  `owners.subscription_expires_at` (על הבעלים — מכסה את כל הדירות שלו) ומאפסת
  `is_frozen`, ושולחת לבעל הדירה מייל + **PDF מצורף** (נוצר מאפס עם pdf-lib, פונט עברי
  מוטמע) דרך Resend. כשלון שליחת מייל לא מבטל את האישור/התוקף במסד הנתונים.
- **הוחלט במפורש לא לבנות:** מחיקת משתמשים מהפאנל.
- **מה עוד חסר:** 5 טאבים מהמסמך המקורי — תשלומים (כטאב דוח/צפייה נפרד), אנליטיקס,
  תמיכה, בעלי דירות, שוכרים רשומים.

---

## 6. מה נשאר פתוח / נדחה במכוון

הרשימה המלאה עם הסברים ב-**`docs/known-limitations.md`**. בקצרה:

| נושא | סטטוס |
|---|---|
| 5 טאבים נוספים בפאנל ניהול | לא קיימים (תשלומים/אנליטיקס/תמיכה/בעלי דירות/שוכרים) |
| Apple Sign-In | נדחה — דורש Apple Developer בתשלום |
| דירוג/ביקורות | לא קיים (שלב 2 במסמך המקורי) |
| סינון חיפוש לפי תאריכים ספציפיים | חיפוש מסנן רק לפי אזור+אורחים (מצב תפוסה כללי כן ניתן לעדכון) |
| עיצוב חזותי/מותג | נדחה בכוונה לסוף, אחרי שכל התכונות בנויות |
| חיבור דומיין `apartments770.com` לאתר עצמו | הדומיין קיים ומאומת ל-Resend, אבל לא מחובר ל-Vercel כדומיין של האתר |

---

## 7. איך ממשיכים

1. **תמיד קודם:** `git pull` — יש שני מקומות שעובדים על הריפו הזה (ראה הערה למעלה)
2. תגיד ל-Claude "תמשיך מהמסמך `docs/project-status.md`" בכל שיחה חדשה
3. **החלטות פתוחות:** אילו מ-5 הטאבים הנוספים בפאנל ניהול הכי דחוף? לחבר את דומיין
   apartments770.com לאתר עצמו עכשיו או בסוף (לפני השקה)?
4. אופן העבודה המוסכם: לפני כל פעולה — הסבר קודם, ולחכות לאישור.

**קישורים שימושיים:**
- אתר חי: https://aparments770.vercel.app
- קוד: https://github.com/ap770official-spec/aparments770/tree/claude/apartments770-basic-setup-oqzbfi
- מסד נתונים: פרויקט Supabase שלך (`ucdqvntoljvrbmqzrehn`)
