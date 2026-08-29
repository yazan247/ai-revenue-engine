import { NextResponse } from "next/server";
import { login, sessionCookie } from "../../../../lib/auth";

export async function POST(request: Request) {
  try { const {email,password}=await request.json(); if(typeof email!=="string"||typeof password!=="string") return NextResponse.json({error:"Email and password are required."},{status:400}); const result=await login(email,password); if(!result) return NextResponse.json({error:"Invalid email or password."},{status:401}); const response=NextResponse.json({account:result.account}); response.headers.set("Set-Cookie",sessionCookie(result.token)); return response; }
  catch(error){ console.error("login failed",error); return NextResponse.json({error:"Unable to sign in."},{status:500}); }
}
