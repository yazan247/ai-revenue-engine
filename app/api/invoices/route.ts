import { NextResponse } from "next/server";
import { createInvoice } from "../../../lib/invoice-service";
import { postgresInvoiceRepository } from "../../../lib/postgres-repository";
import { session } from "../../../lib/auth";
import type { Invoice } from "../../../lib/domain";

export async function GET(request: Request) {
  try { const auth=await session(request); if(!auth) return NextResponse.json({error:"Authentication required."},{status:401}); return NextResponse.json({invoices:await postgresInvoiceRepository.list(auth.accountId)}); }
  catch(error){ console.error("invoice list failed",error); return NextResponse.json({error:"Database is not configured or unavailable."},{status:503}); }
}
export async function POST(request: Request) {
  try { const auth=await session(request); if(!auth) return NextResponse.json({error:"Authentication required."},{status:401}); const body=await request.json() as {customerName?:string;customerEmail?:string;amount?:number;dueDate?:string;currency?:string}; if(!body.customerName?.trim()||!body.customerEmail?.trim()||!body.amount||body.amount<=0||!body.dueDate) return NextResponse.json({error:"customerName, customerEmail, positive amount and dueDate are required."},{status:400}); const existing:Invoice[]=await postgresInvoiceRepository.list(auth.accountId); const invoice=createInvoice({customerName:body.customerName,customerEmail:body.customerEmail,amount:body.amount,dueDate:body.dueDate,currency:body.currency},existing); await postgresInvoiceRepository.create(auth.accountId,invoice); return NextResponse.json({invoice},{status:201}); }
  catch(error){ console.error("invoice create failed",error); return NextResponse.json({error:"Unable to create invoice."},{status:500}); }
}
