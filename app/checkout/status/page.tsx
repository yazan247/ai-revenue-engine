"use client";
import { useSearchParams } from "next/navigation";

export default function CheckoutStatus(){const params=useSearchParams();const id=params.get("requestId");return <main style={{maxWidth:680,margin:"80px auto",padding:24,fontFamily:"system-ui",textAlign:"center"}}><div style={{fontSize:48}}>✓</div><h1>Payment request created</h1><p>Your upgrade request is recorded as <strong>pending payment</strong>. Complete the external payment, then our billing team will verify it before activating your plan.</p>{id&&<p>Request ID: <code>{id}</code></p>}<a href="/" style={{display:"inline-block",marginTop:24}}>Return to InvoicePilot</a></main>}
