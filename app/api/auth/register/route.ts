import { NextResponse } from "next/server";
import { register } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json();
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof name !== "string" || name.trim().length < 2 || typeof password !== "string" || password.length < 8) return NextResponse.json({error:"Valid name, email and an 8+ character password are required."},{status:400});
    const account=await register(email,name,password);
    return NextResponse.json({account},{status:201});
  } catch(error:any) { if(error?.code === "23505") return NextResponse.json({error:"An account with this email already exists."},{status:409}); console.error("register failed",error); return NextResponse.json({error:"Unable to create account."},{status:500}); }
}
