// =============================================================================
// app/api/schemes/route.ts — Flexible Paginated & Eligibility Schemes API
// =============================================================================
// WHY HERE: 
//   In Next.js App Router, app/api/schemes/route.ts maps to GET /api/schemes.
//   Supports:
//     1. Offset & Limit pagination for total schemes (e.g. 20 initially, then 100 per click)
//     2. Eligibility-filtered pagination (e.g. 20 initially, then all remaining eligible)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));
    const offsetParam = searchParams.get("offset");
    const eligibleOnly = searchParams.get("eligible_only") === "true";
    const userAge = searchParams.get("age") ? parseInt(searchParams.get("age")!, 10) : null;
    const userIncome = searchParams.get("income") ? parseInt(searchParams.get("income")!, 10) : null;
    const department = searchParams.get("department") || null;

    let from: number;
    let to: number;

    if (offsetParam !== null) {
      from = Math.max(0, parseInt(offsetParam, 10));
      to = from + limit - 1;
    } else {
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      from = (page - 1) * limit;
      to = from + limit - 1;
    }

    let query = supabase
      .from("services")
      .select("*", { count: "exact" })
      .order("id", { ascending: true });

    // Apply Eligibility Engine filters at database level if requested
    if (eligibleOnly && userAge !== null && userIncome !== null) {
      query = query
        .lte("min_age", userAge)
        .gte("max_income", userIncome);
    }

    // Apply Department filter if specified
    if (department && department !== "All") {
      query = query.or(`department.eq.${department},category.eq.${department}`);
    }

    // Apply range pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Supabase query error in /api/schemes:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const hasMore = to < total - 1;

    return NextResponse.json(
      {
        success: true,
        offset: from,
        limit,
        total,
        hasMore,
        data: data || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
