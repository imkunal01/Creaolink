import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "ccx").toLowerCase();

    const isZip = format === "zip";
    const filename = isZip
      ? "creaolink-premiere-v1.0.0.zip"
      : "creaolink-premiere-v1.0.0.ccx";

    const downloadUrl = new URL(`/downloads/${filename}`, request.url);
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("Plugin download redirect error:", error);
    return NextResponse.json(
      { error: "Failed to download plugin archive" },
      { status: 500 }
    );
  }
}
