import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT id, name, slug FROM skills ORDER BY name ASC"
    );
    return NextResponse.json({ skills: result.rows }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load skills." },
      { status: 500 }
    );
  }
}
