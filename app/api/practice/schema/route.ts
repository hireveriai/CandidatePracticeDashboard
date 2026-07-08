import { NextResponse } from "next/server";
import { getSchemaSupport } from "@/lib/server/practice-candidate";

export async function GET() {
  try {
    const schema = await getSchemaSupport();
    return NextResponse.json({ ok: true, schema });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "DB_SCHEMA_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unable to inspect database schema",
      },
      { status: 500 }
    );
  }
}
