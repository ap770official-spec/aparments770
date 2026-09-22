import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // Keeps the Supabase session cookie fresh on every request, so a
  // Server Component reading it later doesn't see an expired access
  // token even though a valid refresh token exists.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|auth|admin|.*\\..*).*)"],
};
