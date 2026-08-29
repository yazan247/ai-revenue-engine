import { NextResponse } from "next/server";
import { logout, clearSessionCookie } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    await logout(request);
    const response = NextResponse.json({ ok: true });
    response.headers.set("Set-Cookie", clearSessionCookie());
    return response;
  } catch (error) {
    console.error("logout failed", error);
    return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
  }
}
