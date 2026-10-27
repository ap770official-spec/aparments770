import { NextRequest, NextResponse } from "next/server";
import { getPropertiesByIds } from "@/lib/properties";

// Caps how much a single (public, unauthenticated) request can ask the
// DB for, and drops anything that isn't a UUID before it reaches the
// query - a malformed id would otherwise surface as a 500.
const MAX_IDS = 100;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter((id) => UUID_PATTERN.test(id))
    .slice(0, MAX_IDS);

  const properties = await getPropertiesByIds(ids);
  return NextResponse.json({ properties });
}
