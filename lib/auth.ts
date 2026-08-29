import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { getDb } from "./db";
import type { Account, AuthSession } from "./auth-contract";

const COOKIE = "invoicepilot_session";
const DAYS = 7;
function secret() { if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not configured"); return process.env.AUTH_SECRET; }
function hashPassword(password: string, salt = randomBytes(16).toString("hex")) { return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password: string, stored: string) { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const actual = scryptSync(password, salt, 64); const expected = Buffer.from(hash, "hex"); return expected.length === actual.length && timingSafeEqual(actual, expected); }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }
function makeToken(accountId: string) { const exp = Date.now() + DAYS * 86400000; const payload = `${accountId}.${exp}`; return `${payload}.${sign(payload)}`; }
function readToken(request: Request) { const raw = request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1); if (!raw) return null; const [accountId, exp, sig] = raw.split("."); if (!accountId || !exp || !sig || Number(exp) < Date.now()) return null; const payload = `${accountId}.${exp}`; const a=Buffer.from(sig), b=Buffer.from(sign(payload)); if(a.length!==b.length || !timingSafeEqual(a,b)) return null; return accountId; }

export async function register(email: string, name: string, password: string): Promise<Account> {
  const db=getDb(); const id=randomUUID(); const result=await db.query("insert into accounts (id,email,name,password_hash) values ($1,$2,$3,$4) returning id,email,name,created_at", [id,email.trim().toLowerCase(),name.trim(),hashPassword(password)]); return {id:result.rows[0].id,email:result.rows[0].email,name:result.rows[0].name,createdAt:result.rows[0].created_at.toISOString()};
}
export async function login(email: string, password: string) { const db=getDb(); const result=await db.query("select id,email,name,password_hash from accounts where email=$1",[email.trim().toLowerCase()]); const row=result.rows[0]; if(!row || !verifyPassword(password,row.password_hash)) return null; return { account:{id:row.id,email:row.email,name:row.name}, token:makeToken(row.id) }; }
export async function session(request: Request): Promise<AuthSession | null> { const id=readToken(request); if(!id) return null; const row=(await getDb().query("select id,email from accounts where id=$1",[id])).rows[0]; if(!row) return null; return {accountId:row.id,email:row.email,expiresAt:new Date(Date.now()+DAYS*86400000).toISOString()}; }
export function sessionCookie(token:string) { return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS*86400}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }
export function clearSessionCookie() { return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }
