import { NextResponse } from "next/server";
import { session } from "../../../../lib/auth";

export async function GET(request: Request) { try { const value=await session(request); if(!value) return NextResponse.json({authenticated:false},{status:401}); return NextResponse.json({authenticated:true,session:value}); } catch(error){ console.error("session check failed",error); return NextResponse.json({error:"Authentication service unavailable."},{status:503}); } }
