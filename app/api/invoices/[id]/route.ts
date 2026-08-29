import { NextResponse } from "next/server";
import { postgresInvoiceRepository } from "../../../../lib/postgres-repository";
import { session } from "../../../../lib/auth";
import type { InvoiceStatus } from "../../../../lib/domain";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const auth=await session(request); if(!auth) return NextResponse.json({error:"Authentication required."},{status:401}); const {id}=await params; const body=await request.json() as {status?:InvoiceStatus}; if(!body.status||!["overdue","due_soon","paid"].includes(body.status)) return NextResponse.json({error:"A valid status is required."},{status:400}); const invoice=await postgresInvoiceRepository.updateStatus(auth.accountId,id,body.status); if(!invoice) return NextResponse.json({error:"Invoice not found."},{status:404}); return NextResponse.json({invoice}); }
  catch(error){ console.error("PATCH /api/invoices/[id] failed",error); return NextResponse.json({error:"Database unavailable."},{status:503}); }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const auth=await session(request); if(!auth) return NextResponse.json({error:"Authentication required."},{status:401}); const {id}=await params; const removed=await postgresInvoiceRepository.remove(auth.accountId,id); if(!removed) return NextResponse.json({error:"Invoice not found."},{status:404}); return new NextResponse(null,{status:204}); }
  catch(error){ console.error("DELETE /api/invoices/[id] failed",error); return NextResponse.json({error:"Database unavailable."},{status:503}); }
}
